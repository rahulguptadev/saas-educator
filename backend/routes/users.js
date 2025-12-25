const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    
    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change current user's password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/students
// @desc    Get all students (without sensitive data for teachers)
// @access  Private (Teacher, Admin)
router.get('/students', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    // Admins can see all students (active and inactive), teachers only see active ones
    const query = req.user.role === 'admin' 
      ? { role: 'student' }
      : { role: 'student', isActive: true };
    
    const students = await User.find(query)
      .select('name avatar role createdAt isActive');

    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/teachers
// @desc    Get all teachers (admins see all, including inactive)
// @access  Private (Admin)
router.get('/teachers', protect, authorize('admin'), async (req, res) => {
  try {
    // Admins can see all teachers (active and inactive)
    const teachers = await User.find({ role: 'teacher' })
      .select('name email phone avatar role createdAt isActive');

    res.json({ teachers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/available
// @desc    Get all users available for chatting (role-based)
// @access  Private
router.get('/available', protect, async (req, res) => {
  try {
    let users;

    if (req.user.role === 'admin') {
      // Admins can see all users
      users = await User.find({ _id: { $ne: req.user._id }, isActive: true })
        .select('name email avatar role');
    } else if (req.user.role === 'teacher') {
      // Teachers can see students and other teachers
      // Get all users first, then filter out email for students
      const allUsers = await User.find({
        _id: { $ne: req.user._id },
        isActive: true,
        role: { $in: ['student', 'teacher'] }
      })
        .select('name avatar role email phone');
      
      // Hide email and phone from students for teachers
      users = allUsers.map(u => {
        const userObj = u.toObject();
        if (userObj.role === 'student') {
          delete userObj.email;
          delete userObj.phone;
        }
        return userObj;
      });
    } else if (req.user.role === 'student') {
      // Students can see teachers and other students
      users = await User.find({
        _id: { $ne: req.user._id },
        isActive: true,
        role: { $in: ['student', 'teacher'] }
      })
        .select('name avatar role');
    } else {
      users = [];
    }

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (with role-based data filtering)
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hide sensitive data from teachers
    let userData = user.toJSON();
    if (req.user.role === 'teacher' && user.role === 'student') {
      delete userData.email;
      delete userData.phone;
    }

    res.json({ user: userData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

