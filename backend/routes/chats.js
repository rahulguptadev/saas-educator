const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/chats
// @desc    Create a new chat (private or group)
// @access  Private
router.post('/', [
  body('type').isIn(['private', 'group']).withMessage('Type must be private or group'),
  body('participantIds').isArray().withMessage('Participant IDs must be an array'),
  body('name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, participantIds, name } = req.body;

    // Validate participants
    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    // For private chats, must have exactly 2 participants
    if (type === 'private' && participantIds.length !== 1) {
      return res.status(400).json({ message: 'Private chat must have exactly one other participant' });
    }

    // For group chats, admin can create, others cannot
    if (type === 'group' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create group chats' });
    }

    // Add current user to participants
    const allParticipants = [...new Set([req.user._id.toString(), ...participantIds])];

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
// @desc    Get all chats for current user
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

