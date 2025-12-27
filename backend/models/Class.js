const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Optional: Link to a group (if class is for a group)
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  jitsiRoomName: {
    type: String,
    unique: true,
    required: true
  },
  meetingLink: {
    type: String,
    required: true
  },
  // Recurrence fields
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: null
  },
  recurrenceDays: [{
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  }],
  recurrenceEndDate: {
    type: Date
  },
  recurrenceDuration: {
    type: Number, // in months
  },
  parentClassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  }
}, {
  timestamps: true
});

// Generate Jitsi room name and meeting link before saving if not provided
classSchema.pre('save', function(next) {
  if (!this.jitsiRoomName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    this.jitsiRoomName = `class-${timestamp}-${random}`;
  }
  if (!this.meetingLink) {
    this.meetingLink = `https://meet.jit.si/${this.jitsiRoomName}`;
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);

