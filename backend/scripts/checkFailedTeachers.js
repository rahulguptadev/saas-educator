const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function checkFailedTeachers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected\n');

    const failedEmails = [
      'roopinderkaur@gmail.com',
      'divyagoel@gmail.com',
      'arpitadasray@gmail.com',
      'ritikagarg@gmail.com',
      'sunainaaggarwal@gmail.com'
    ];

    console.log('Checking for these emails in database:\n');
    
    for (const email of failedEmails) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        console.log(`✓ ${email}: EXISTS (Role: ${user.role}, Name: ${user.name})`);
      } else {
        console.log(`✗ ${email}: NOT FOUND`);
      }
    }

    // Check all teachers
    console.log('\n=== All Teachers in Database ===');
    const allTeachers = await User.find({ role: 'teacher' }).select('name email');
    console.log(`Total: ${allTeachers.length}`);
    allTeachers.forEach(t => {
      console.log(`  - ${t.name} (${t.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFailedTeachers();


