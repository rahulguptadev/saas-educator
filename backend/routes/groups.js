const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/groups
// @desc    Get groups based on user role
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'teacher') {
      // Teachers see only their groups
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      // Students see groups they belong to
      query.students = req.user._id;
    }
    // Admin sees all groups
    
    const groups = await Group.find(query)
      .populate('teacher', 'name email phone')
      .populate('students', 'name email phone grade school')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('teacher', 'name email phone specialization qualification')
      .populate('students', 'name email phone grade school')
      .populate('createdBy', 'name');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check access
    if (req.user.role === 'teacher' && group.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (req.user.role === 'student' && !group.students.some(s => s._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('teacher').notEmpty().withMessage('Teacher is required'),
  body('students').isArray().withMessage('Students must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, teacher, students } = req.body;

    // Verify teacher exists and is a teacher
    const teacherUser = await User.findById(teacher);
    if (!teacherUser || teacherUser.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher selected' });
    }

    // Verify all students exist and are students
    if (students && students.length > 0) {
      const studentUsers = await User.find({ _id: { $in: students }, role: 'student' });
      if (studentUsers.length !== students.length) {
        return res.status(400).json({ message: 'One or more invalid students selected' });
      }
    }

    const group = await Group.create({
      name,
      description,
      teacher,
      students: students || [],
      createdBy: req.user._id
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('teacher', 'name email phone')
      .populate('students', 'name email phone grade school')
      .populate('createdBy', 'name');

    res.status(201).json({ 
      message: 'Group created successfully',
      group: populatedGroup 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), [
  body('name').optional().trim().notEmpty().withMessage('Group name cannot be empty'),
  body('students').optional().isArray().withMessage('Students must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, teacher, students, isActive } = req.body;
    
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify teacher if being updated
    if (teacher) {
      const teacherUser = await User.findById(teacher);
      if (!teacherUser || teacherUser.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid teacher selected' });
      }
      group.teacher = teacher;
    }

    // Verify students if being updated
    if (students) {
      if (students.length > 0) {
        const studentUsers = await User.find({ _id: { $in: students }, role: 'student' });
        if (studentUsers.length !== students.length) {
          return res.status(400).json({ message: 'One or more invalid students selected' });
        }
      }
      group.students = students;
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (isActive !== undefined) group.isActive = isActive;

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('teacher', 'name email phone')
      .populate('students', 'name email phone grade school')
      .populate('createdBy', 'name');

    res.json({ 
      message: 'Group updated successfully',
      group: updatedGroup 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    await group.deleteOne();
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/groups/my-students
// @desc    Get all students from teacher's groups (for teachers)
// @access  Private (Teacher only)
router.get('/teacher/my-students', protect, authorize('teacher'), async (req, res) => {
  try {
    // Find all groups where this teacher is assigned
    const groups = await Group.find({ teacher: req.user._id, isActive: true })
      .populate('students', 'name email phone grade school isActive');
    
    // Extract unique students from all groups
    const studentMap = new Map();
    groups.forEach(group => {
      group.students.forEach(student => {
        if (student.isActive && !studentMap.has(student._id.toString())) {
          studentMap.set(student._id.toString(), {
            ...student.toObject(),
            groups: []
          });
        }
        if (student.isActive) {
          studentMap.get(student._id.toString()).groups.push({
            _id: group._id,
            name: group.name
          });
        }
      });
    });
    
    const students = Array.from(studentMap.values());
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/groups/my-teachers
// @desc    Get all teachers from student's groups (for students)
// @access  Private (Student only)
router.get('/student/my-teachers', protect, authorize('student'), async (req, res) => {
  try {
    // Find all groups where this student is a member
    const groups = await Group.find({ students: req.user._id, isActive: true })
      .populate('teacher', 'name email phone specialization qualification isActive');
    
    // Extract unique teachers from all groups
    const teacherMap = new Map();
    groups.forEach(group => {
      if (group.teacher && group.teacher.isActive && !teacherMap.has(group.teacher._id.toString())) {
        teacherMap.set(group.teacher._id.toString(), {
          ...group.teacher.toObject(),
          groups: []
        });
      }
      if (group.teacher && group.teacher.isActive) {
        teacherMap.get(group.teacher._id.toString()).groups.push({
          _id: group._id,
          name: group.name
        });
      }
    });
    
    const teachers = Array.from(teacherMap.values());
    res.json({ teachers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

