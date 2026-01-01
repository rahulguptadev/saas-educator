const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function testAPI() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom';
    await mongoose.connect(uri);
    console.log('MongoDB Connected\n');

    // Test the same queries used by the API
    console.log('=== Testing API Queries ===\n');
    
    // Test teachers query (same as /api/users/teachers)
    const teachers = await User.find({ role: 'teacher' })
      .select('name email phone avatar role createdAt isActive');
    console.log(`Teachers found: ${teachers.length}`);
    teachers.forEach(t => console.log(`  - ${t.name} (${t.email}) - Active: ${t.isActive}`));
    
    // Test students query (same as /api/users/students for admin)
    const students = await User.find({ role: 'student' })
      .select('name email phone avatar role createdAt isActive');
    console.log(`\nStudents found: ${students.length}`);
    students.forEach(s => console.log(`  - ${s.name} (${s.email}) - Active: ${s.isActive}`));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPI();

