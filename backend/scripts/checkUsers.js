const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function checkUsers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom';
    console.log('Connecting to:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected\n');

    // Count all users
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });

    console.log('=== User Counts ===');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Admins: ${totalAdmins}`);
    console.log(`Teachers: ${totalTeachers}`);
    console.log(`Students: ${totalStudents}\n`);

    // List all users
    if (totalUsers > 0) {
      console.log('=== All Users ===');
      const users = await User.find().select('name email role isActive');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log('⚠️  No users found in database!');
    }

    // Check database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`\nCurrent Database: ${dbName}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();

