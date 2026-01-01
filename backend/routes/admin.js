const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(protect, authorize('admin'));

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalClasses = await Class.countDocuments();
    const upcomingClasses = await Class.countDocuments({ 
      scheduledTime: { $gte: new Date() },
      status: 'scheduled'
    });

    res.json({
      stats: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalClasses,
        upcomingClasses
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/Deactivate user
// @access  Private (Admin)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user (teacher or student)
// @access  Private (Admin)
router.post('/users', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['teacher', 'student']).withMessage('Role must be teacher or student')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, email, phone, password, role,
      // Student fields
      grade, school, fatherName, fatherContact, motherName, motherContact, enrolledSubjects,
      // Teacher fields
      specialization, qualification
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Build user data
    const userData = {
      name,
      email,
      phone: phone || '',
      password,
      role,
      isActive: true
    };

    // Add student-specific fields
    if (role === 'student') {
      if (grade) userData.grade = grade;
      if (school) userData.school = school;
      if (fatherName) userData.fatherName = fatherName;
      if (fatherContact) userData.fatherContact = fatherContact;
      if (motherName) userData.motherName = motherName;
      if (motherContact) userData.motherContact = motherContact;
      if (enrolledSubjects && enrolledSubjects.length > 0) {
        userData.enrolledSubjects = enrolledSubjects;
      }
    }

    // Add teacher-specific fields
    if (role === 'teacher') {
      if (specialization) userData.specialization = specialization;
      if (qualification) userData.qualification = qualification;
    }

    // Create user
    const user = await User.create(userData);
    const userResponse = user.toJSON();

    res.status(201).json({ 
      message: `${role} created successfully`,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

