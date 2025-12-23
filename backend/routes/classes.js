const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/classes
// @desc    Create a new class
// @access  Private (Teacher)
router.post('/', protect, authorize('teacher'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required'),
  body('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, scheduledTime, duration, studentIds } = req.body;

    // Verify students exist
    if (studentIds && studentIds.length > 0) {
      const students = await User.find({ 
        _id: { $in: studentIds }, 
        role: 'student' 
      });
      
      if (students.length !== studentIds.length) {
        return res.status(400).json({ message: 'Some students not found' });
      }
    }

    // Generate Jitsi room name and meeting link
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const jitsiRoomName = `class-${timestamp}-${random}`;
    const meetingLink = `https://meet.jit.si/${jitsiRoomName}`;

    const newClass = await Class.create({
      title,
      description,
      teacher: req.user._id,
      students: studentIds || [],
      scheduledTime: new Date(scheduledTime),
      duration: duration || 60,
      jitsiRoomName,
      meetingLink
    });

    await newClass.populate('teacher', 'name email');
    await newClass.populate('students', 'name avatar');

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
        .sort({ scheduledTime: -1 });
    } else if (req.user.role === 'teacher') {
      classes = await Class.find({ teacher: req.user._id })
        .populate('students', 'name avatar')
        .sort({ scheduledTime: -1 });
    } else if (req.user.role === 'student') {
      classes = await Class.find({ students: req.user._id })
        .populate('teacher', 'name email')
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
      .populate('students', 'name avatar');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check access
    if (req.user.role === 'student' && !classItem.students.some(s => s._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'teacher' && classItem.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
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

    res.json({ class: classItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

