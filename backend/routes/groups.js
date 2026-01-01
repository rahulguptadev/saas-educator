const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/groups
// @desc    Get all groups (admin) or groups user belongs to (student/teacher)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let groups;
    
    if (req.user.role === 'admin') {
      // Admins can see all groups
      groups = await Group.find({ isActive: true })
        .populate('members', 'name avatar role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Students and teachers can see groups they belong to
      groups = await Group.find({ 
        members: req.user._id,
        isActive: true 
      })
        .populate('members', 'name avatar role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json({ groups: groups || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name avatar role')
      .populate('createdBy', 'name email');

    if (!group || !group.isActive) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user has access (admin or member)
    if (req.user.role !== 'admin' && !group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/groups
// @desc    Create a new group (admin only)
// @access  Private (Admin)
router.post('/', authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('memberIds').optional().isArray().withMessage('Member IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, memberIds } = req.body;

    // Verify members exist (can be students or teachers)
    let finalMemberIds = [];
    if (memberIds && memberIds.length > 0) {
      const members = await User.find({ 
        _id: { $in: memberIds }, 
        role: { $in: ['student', 'teacher'] }
      });
      
      if (members.length !== memberIds.length) {
        return res.status(400).json({ message: 'Some members not found or invalid role' });
      }
      
      finalMemberIds = members.map(m => m._id);
    }

    const newGroup = await Group.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      members: finalMemberIds
    });

    await newGroup.populate('members', 'name avatar role');
    await newGroup.populate('createdBy', 'name email');

    res.status(201).json({ group: newGroup });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update a group (admin only)
// @access  Private (Admin)
router.put('/:id', authorize('admin'), [
  body('name').optional().trim().notEmpty().withMessage('Group name cannot be empty'),
  body('memberIds').optional().isArray().withMessage('Member IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const group = await Group.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const { name, description, memberIds } = req.body;

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    if (memberIds !== undefined) {
      // Verify members exist (can be students or teachers)
      if (memberIds.length > 0) {
        const members = await User.find({ 
          _id: { $in: memberIds }, 
          role: { $in: ['student', 'teacher'] }
        });
        
        if (members.length !== memberIds.length) {
          return res.status(400).json({ message: 'Some members not found or invalid role' });
        }
        
        group.members = members.map(m => m._id);
      } else {
        group.members = [];
      }
    }

    await group.save();
    await group.populate('members', 'name avatar role');
    await group.populate('createdBy', 'name email');

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group (soft delete, admin only)
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Soft delete
    group.isActive = false;
    await group.save();

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
