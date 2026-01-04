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
      name, email, phone, password, role, isActive,
      // Student fields
      grade, school, fatherName, fatherContact, motherName, motherContact, enrolledSubjects,
      // Teacher fields
      specialization, qualification, education, bio, subjects
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
      isActive: isActive !== undefined ? isActive : true
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
      if (education) userData.education = education;
      if (bio) userData.bio = bio;
      if (subjects) userData.subjects = subjects;
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

// @route   PUT /api/admin/users/:id
// @desc    Update user details
// @access  Private (Admin)
router.put('/users/:id', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, email, phone, password,
      // Student fields
      grade, school, fatherName, fatherContact, motherName, motherContact, enrolledSubjects,
      // Teacher fields
      specialization, qualification, education, bio, subjects
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build update data
    const updateData = {};

    // Common fields
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateData.email = email;
    }

    // Update password if provided
    if (password) {
      updateData.password = password;
    }

    // Student-specific fields
    if (user.role === 'student') {
      if (grade !== undefined) updateData.grade = grade;
      if (school !== undefined) updateData.school = school;
      if (fatherName !== undefined) updateData.fatherName = fatherName;
      if (fatherContact !== undefined) updateData.fatherContact = fatherContact;
      if (motherName !== undefined) updateData.motherName = motherName;
      if (motherContact !== undefined) updateData.motherContact = motherContact;
      if (enrolledSubjects !== undefined) updateData.enrolledSubjects = enrolledSubjects;
    }

    // Teacher-specific fields
    if (user.role === 'teacher') {
      if (specialization !== undefined) updateData.specialization = specialization;
      if (qualification !== undefined) updateData.qualification = qualification;
      if (education !== undefined) updateData.education = education;
      if (bio !== undefined) updateData.bio = bio;
      if (subjects !== undefined) updateData.subjects = subjects;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ 
      message: 'User updated successfully',
      user: updatedUser
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

