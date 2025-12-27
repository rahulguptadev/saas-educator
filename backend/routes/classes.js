const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const User = require('../models/User');
const Group = require('../models/Group');
const { protect, authorize } = require('../middleware/auth');
const { generateRecurringClasses, generateJitsiRoom } = require('../utils/recurrence');

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

    const { 
      title, 
      description, 
      scheduledTime, 
      duration, 
      studentIds, 
      groupId,
      // Recurrence options
      isRecurring,
      recurrencePattern,
      recurrenceDays,
      recurrenceEndDate,
      recurrenceDuration
    } = req.body;

    let finalStudentIds = [];
    let groupRef = null;

    // Validation: Must have either groupId or at least one student
    if (!groupId && (!studentIds || studentIds.length === 0)) {
      return res.status(400).json({ 
        message: 'Please select either a group or at least one student' 
      });
    }

    // If groupId is provided, get students from the group
    if (groupId) {
      const group = await Group.findById(groupId);
      
      if (!group) {
        return res.status(400).json({ message: 'Group not found' });
      }
      
      // Verify the teacher belongs to this group
      if (group.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only create classes for your own groups' });
      }
      
      finalStudentIds = group.students;
      groupRef = groupId;
    } else if (studentIds && studentIds.length > 0) {
      // Verify students exist and belong to teacher's groups
      const teacherGroups = await Group.find({ teacher: req.user._id, isActive: true });
      const allowedStudentIds = new Set();
      teacherGroups.forEach(g => {
        g.students.forEach(s => allowedStudentIds.add(s.toString()));
      });
      
      // Check if all selected students are from teacher's groups
      const invalidStudents = studentIds.filter(id => !allowedStudentIds.has(id.toString()));
      if (invalidStudents.length > 0) {
        return res.status(403).json({ 
          message: 'You can only add students from your assigned groups' 
        });
      }
      
      finalStudentIds = studentIds;
    }

    const baseClassData = {
      title,
      description,
      teacher: req.user._id,
      group: groupRef,
      students: finalStudentIds,
      duration: duration || 60,
      status: 'scheduled', // Always set to scheduled for new classes
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : null,
      recurrenceDays: isRecurring && recurrenceDays ? recurrenceDays : [],
      recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      recurrenceDuration: isRecurring && recurrenceDuration ? recurrenceDuration : null
    };

    // If recurring, generate all class instances
    if (isRecurring && recurrencePattern) {
      const classesToCreate = generateRecurringClasses(baseClassData, {
        recurrencePattern,
        recurrenceDays: recurrenceDays || [],
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        recurrenceDuration: recurrenceDuration || 1,
        startTime: scheduledTime
      });

      // Safety check: limit number of classes
      if (classesToCreate.length === 0) {
        return res.status(400).json({ 
          message: 'No classes generated. Please check your recurrence settings.' 
        });
      }

      if (classesToCreate.length > 500) {
        return res.status(400).json({ 
          message: `Too many classes would be created (${classesToCreate.length}). Please reduce the duration or use a more specific end date. Maximum 500 classes allowed.` 
        });
      }

      // Generate unique Jitsi rooms for each class
      const classesWithRooms = classesToCreate.map(classData => {
        const { jitsiRoomName, meetingLink } = generateJitsiRoom();
        return {
          ...classData,
          jitsiRoomName,
          meetingLink
        };
      });

      // Create all classes
      const createdClasses = await Class.insertMany(classesWithRooms);
      
      // Populate the first class for response
      await createdClasses[0].populate('teacher', 'name email');
      await createdClasses[0].populate('students', 'name avatar');
      await createdClasses[0].populate('group', 'name');

      res.status(201).json({ 
        message: `Created ${createdClasses.length} recurring classes`,
        classes: createdClasses,
        count: createdClasses.length
      });
    } else {
      // Single class creation
      const { jitsiRoomName, meetingLink } = generateJitsiRoom();
      
      const newClass = await Class.create({
        ...baseClassData,
        scheduledTime: new Date(scheduledTime),
        jitsiRoomName,
        meetingLink
      });

      await newClass.populate('teacher', 'name email');
      await newClass.populate('students', 'name avatar');
      await newClass.populate('group', 'name');

      res.status(201).json({ class: newClass });
    }
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

