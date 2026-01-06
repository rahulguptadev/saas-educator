const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const User = require('../models/User');
const Group = require('../models/Group');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/classes
// @desc    Create a new class
// @access  Private (Teacher, Admin)
router.post('/', protect, authorize('teacher', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required'),
  body('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
  body('teacherId').optional().isMongoId().withMessage('Valid teacher ID is required when creating as admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, scheduledTime, duration, studentIds, groupId, teacherId } = req.body;

    // Determine teacher: if admin, require teacherId; if teacher, use req.user._id
    let teacherUserId;
    if (req.user.role === 'admin') {
      if (!teacherId) {
        return res.status(400).json({ message: 'Teacher ID is required when creating class as admin' });
      }
      // Verify teacher exists and is actually a teacher
      const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
      if (!teacher) {
        return res.status(400).json({ message: 'Invalid teacher ID or user is not a teacher' });
      }
      teacherUserId = teacherId;
    } else {
      teacherUserId = req.user._id;
    }

    let finalStudentIds = [];
    let groupRef = null;

    // Validate that either a group or students are selected
    if (!groupId && (!studentIds || studentIds.length === 0)) {
      return res.status(400).json({ message: 'Please select a group or at least one student' });
    }

    // If group is selected, get students from group (filter only students, not teachers)
    if (groupId) {
      const group = await Group.findOne({ 
        _id: groupId, 
        isActive: true 
      }).populate('members', 'role');
      
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      groupRef = group._id;
      // Filter only students from group members
      finalStudentIds = group.members
        .filter(m => m.role === 'student')
        .map(m => m._id.toString());
    } else if (studentIds && studentIds.length > 0) {
      // Verify students exist
      const students = await User.find({ 
        _id: { $in: studentIds }, 
        role: 'student' 
      });
      
      if (students.length !== studentIds.length) {
        return res.status(400).json({ message: 'Some students not found' });
      }
      
      finalStudentIds = studentIds;
    }

    // Generate Jitsi room name and meeting link
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const jitsiRoomName = `class-${timestamp}-${random}`;
    const meetingLink = `https://meet.jit.si/${jitsiRoomName}`;

    const newClass = await Class.create({
      title,
      description,
      teacher: teacherUserId,
      students: finalStudentIds,
      group: groupRef,
      scheduledTime: new Date(scheduledTime),
      duration: duration || 60,
      jitsiRoomName,
      meetingLink
    });

    await newClass.populate('teacher', 'name email');
    await newClass.populate('students', 'name avatar');
    await newClass.populate('group', 'name');

    res.status(201).json({ class: newClass });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/classes
// @desc    Get classes based on user role
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let classes;

    if (req.user.role === 'admin') {
      classes = await Class.find()
        .populate('teacher', 'name email')
        .populate('students', 'name avatar')
        .populate('group', 'name')
        .sort({ scheduledTime: -1 });
    } else if (req.user.role === 'teacher') {
      classes = await Class.find({ teacher: req.user._id })
        .populate('students', 'name avatar')
        .populate('group', 'name')
        .sort({ scheduledTime: -1 });
    } else if (req.user.role === 'student') {
      classes = await Class.find({ students: req.user._id })
        .populate('teacher', 'name email')
        .populate('group', 'name')
        .sort({ scheduledTime: -1 });
    }

    res.json({ classes: classes || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/classes/:id
// @desc    Get class by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name avatar')
      .populate('group', 'name');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check access (admins can access any class)
    if (req.user.role !== 'admin') {
      if (req.user.role === 'student' && !classItem.students.some(s => s._id.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (req.user.role === 'teacher' && classItem.teacher._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ class: classItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private (Teacher, Admin)
router.put('/:id', protect, authorize('teacher', 'admin'), [
  body('title').optional().trim().notEmpty(),
  body('scheduledTime').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if teacher owns the class (unless admin)
    if (req.user.role === 'teacher' && classItem.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, scheduledTime, duration, studentIds, status } = req.body;

    if (title) classItem.title = title;
    if (description !== undefined) classItem.description = description;
    if (scheduledTime) classItem.scheduledTime = new Date(scheduledTime);
    if (duration) classItem.duration = duration;
    if (status) classItem.status = status;
    if (studentIds) {
      const students = await User.find({ 
        _id: { $in: studentIds }, 
        role: 'student' 
      });
      classItem.students = students.map(s => s._id);
    }

    await classItem.save();
    await classItem.populate('teacher', 'name email');
    await classItem.populate('students', 'name avatar');
    await classItem.populate('group', 'name');

    res.json({ class: classItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Teacher, Admin)
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if teacher owns the class (unless admin)
    if (req.user.role === 'teacher' && classItem.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await classItem.deleteOne();

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/classes/:id/join
// @desc    Join a class (for students)
// @access  Private (Student)
router.post('/:id/join', protect, authorize('student'), async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!classItem.students.includes(req.user._id)) {
      classItem.students.push(req.user._id);
      await classItem.save();
    }

    await classItem.populate('teacher', 'name email');
    await classItem.populate('students', 'name avatar');
    await classItem.populate('group', 'name');

    res.json({ class: classItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

