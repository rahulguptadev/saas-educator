const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

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

