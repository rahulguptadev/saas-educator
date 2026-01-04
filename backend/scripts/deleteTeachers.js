const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function deleteTeachers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected\n');

    // Find all teachers
    const allTeachers = await User.find({ role: 'teacher' }).select('name email');
    console.log(`Found ${allTeachers.length} teachers in database\n`);

    // Find the teacher to keep
    const teacherToKeep = await User.findOne({ 
      role: 'teacher', 
      email: 'teacher1@gmail.com' 
    });

    if (!teacherToKeep) {
      console.log('⚠️  Warning: teacher1@gmail.com not found in database');
      console.log('All teachers will be deleted.\n');
    } else {
      console.log(`✓ Keeping teacher: ${teacherToKeep.name} (${teacherToKeep.email})\n`);
    }

    // Delete all teachers except teacher1@gmail.com
    const deleteResult = await User.deleteMany({
      role: 'teacher',
      email: { $ne: 'teacher1@gmail.com' }
    });

    console.log(`\n✅ Deleted ${deleteResult.deletedCount} teacher(s)`);
    
    // Show remaining teachers
    const remainingTeachers = await User.find({ role: 'teacher' }).select('name email');
    console.log(`\nRemaining teachers: ${remainingTeachers.length}`);
    remainingTeachers.forEach(t => {
      console.log(`  - ${t.name} (${t.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTeachers();

