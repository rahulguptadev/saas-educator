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

