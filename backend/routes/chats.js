const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/chats
// @desc    Create a new chat (private or group)
// @access  Private
router.post('/', [
  body('type').isIn(['private', 'group']).withMessage('Type must be private or group'),
  body('participantIds').optional().isArray().withMessage('Participant IDs must be an array'),
  body('groupId').optional().isMongoId().withMessage('Invalid group ID'),
  body('name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, participantIds, groupId, name } = req.body;

    let allParticipants = [];

    // If groupId is provided, get participants from group
    if (groupId) {
      const group = await Group.findById(groupId).populate('members', '_id');
      
      if (!group || !group.isActive) {
        return res.status(404).json({ message: 'Group not found' });
      }

      // Check if user belongs to this group
      if (req.user.role !== 'admin' && !group.members.some(m => m._id.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'You are not a member of this group' });
      }

      allParticipants = group.members.map(m => m._id.toString());
    } else {
      // Validate participants
      if (!participantIds || participantIds.length === 0) {
        return res.status(400).json({ message: 'At least one participant is required' });
      }

      // For private chats, must have exactly 2 participants
      if (type === 'private' && participantIds.length !== 1) {
        return res.status(400).json({ message: 'Private chat must have exactly one other participant' });
      }

      // For group chats, only admins can create manually
      if (type === 'group' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create group chats manually. Use groupId to create from a group.' });
      }

      // For non-admin users, validate that all participants share at least one group
      if (req.user.role !== 'admin') {
        // Get all groups the current user belongs to
        const userGroups = await Group.find({
          members: req.user._id,
          isActive: true
        }).select('members');

        if (userGroups.length === 0) {
          return res.status(403).json({ message: 'You must be a member of at least one group to create chats' });
        }

        // Collect all user IDs from groups the current user belongs to
        const userIdsInGroups = new Set();
        userGroups.forEach(group => {
          group.members.forEach(memberId => {
            userIdsInGroups.add(memberId.toString());
          });
        });

        // Verify all requested participants are in at least one shared group
        const invalidParticipants = participantIds.filter(pid => !userIdsInGroups.has(pid.toString()));
        if (invalidParticipants.length > 0) {
          return res.status(403).json({ 
            message: 'You can only chat with users who belong to your groups' 
          });
        }
      }

      // Add current user to participants
      allParticipants = [...new Set([req.user._id.toString(), ...participantIds])];
    }

    // Check if private chat already exists
    if (type === 'private') {
      const existingChat = await Chat.findOne({
        type: 'private',
        participants: { $all: allParticipants, $size: 2 }
      });

      if (existingChat) {
        await existingChat.populate('participants', 'name email avatar');
        return res.json({ chat: existingChat });
      }
    }

    // Verify all participants exist
    const participants = await User.find({ _id: { $in: allParticipants } });
    if (participants.length !== allParticipants.length) {
      return res.status(400).json({ message: 'Some participants not found' });
    }

    // Create chat
    const chat = await Chat.create({
      type,
      participants: allParticipants,
      name: name || (type === 'private' ? null : 'Group Chat'),
      createdBy: req.user._id
    });

    await chat.populate('participants', 'name email avatar role');
    await chat.populate('createdBy', 'name email');

    res.status(201).json({ chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chats
// @desc    Get all chats for current user (including group-based chats)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let chats;

    if (req.user.role === 'admin') {
      // Admins can see all chats
      chats = await Chat.find({ isActive: true })
        .populate('participants', 'name email avatar role')
        .populate('createdBy', 'name email')
        .sort({ updatedAt: -1 });
    } else {
      // Regular users see only their chats
      chats = await Chat.find({
        participants: req.user._id,
        isActive: true
      })
        .populate('participants', 'name email avatar role')
        .populate('createdBy', 'name email')
        .sort({ updatedAt: -1 });

      // Also get group chats for groups user belongs to
      const userGroups = await Group.find({
        members: req.user._id,
        isActive: true
      }).populate('members', '_id');

      // Create or get group chats for each group
      for (const group of userGroups) {
        const memberIds = group.members.map(m => m._id.toString());
        
        // Check if group chat already exists
        let groupChat = await Chat.findOne({
          type: 'group',
          participants: { $all: memberIds, $size: memberIds.length },
          name: group.name
        });

        if (!groupChat) {
          // Create group chat if it doesn't exist
          groupChat = await Chat.create({
            type: 'group',
            participants: memberIds,
            name: group.name,
            createdBy: group.createdBy
          });
        }

        // Check if user is already in this chat's participants
        if (!groupChat.participants.some(p => p.toString() === req.user._id.toString())) {
          groupChat.participants.push(req.user._id);
          await groupChat.save();
        }

        // Add to chats if not already included
        if (!chats.some(c => c._id.toString() === groupChat._id.toString())) {
          await groupChat.populate('participants', 'name email avatar role');
          await groupChat.populate('createdBy', 'name email');
          chats.push(groupChat);
        }
      }
    }

    // Get last message for each chat
    const chatsWithLastMessage = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await Message.findOne({ chat: chat._id, isDeleted: false })
          .populate('sender', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(1);

        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user._id },
          readBy: { $not: { $elemMatch: { user: req.user._id } } },
          isDeleted: false
        });

        return {
          ...chat.toObject(),
          lastMessage: lastMessage || null,
          unreadCount
        };
      })
    );

    res.json({ chats: chatsWithLastMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chats/:id
// @desc    Get chat by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name email avatar role')
      .populate('createdBy', 'name email');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check access (admin can access any, others must be participant)
    if (req.user.role !== 'admin' && !chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chats/:id/messages
// @desc    Get messages for a chat
// @access  Private
router.get('/:id/messages', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && !chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chat: chat._id, isDeleted: false })
      .populate('sender', 'name email avatar role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Mark messages as read
    await Message.updateMany(
      {
        chat: chat._id,
        sender: { $ne: req.user._id },
        readBy: { $not: { $elemMatch: { user: req.user._id } } }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/chats/:id/messages
// @desc    Send a message to a chat
// @access  Private
router.post('/:id/messages', [
  body('content').trim().notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && !chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { content } = req.body;

    const message = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      content
    });

    // Update chat's updatedAt
    chat.updatedAt = new Date();
    await chat.save();

    await message.populate('sender', 'name email avatar role');

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/chats/:id
// @desc    Delete a chat (admin only, or creator for groups)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only admin or group creator can delete
    if (req.user.role !== 'admin' && chat.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    chat.isActive = false;
    await chat.save();

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

