const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema for enrolled subjects (for students)
const enrolledSubjectSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  classes: {
    type: Number,
    default: 0
  },
  fees: {
    type: Number,
    default: 0
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Student-specific fields
  grade: {
    type: String,
    trim: true
  },
  school: {
    type: String,
    trim: true
  },
  
  // Parent information (for students)
  fatherName: {
    type: String,
    trim: true
  },
  fatherContact: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  motherContact: {
    type: String,
    trim: true
  },
  
  // Enrolled subjects (for students)
  enrolledSubjects: [enrolledSubjectSchema],
  
  // Teacher-specific fields
  specialization: {
    type: String,
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);

