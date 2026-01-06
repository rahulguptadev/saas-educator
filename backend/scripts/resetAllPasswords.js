const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function resetAllPasswords() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected\n');

    const defaultPassword = 'password123';
    console.log(`Resetting all passwords to: ${defaultPassword}\n`);

    // Get all users except admins
    const users = await User.find({ role: { $in: ['teacher', 'student'] } })
      .select('name email role isActive');

    console.log(`Found ${users.length} users to reset\n`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        // Set password directly - the pre-save hook will hash it
        const userToUpdate = await User.findById(user._id);
        userToUpdate.password = defaultPassword;
        await userToUpdate.save();
        
        console.log(`✓ ${user.name} (${user.email}) - Password reset`);
        successCount++;
      } catch (error) {
        console.error(`✗ ${user.name} (${user.email}) - Failed: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`\nAll passwords have been reset to: ${defaultPassword}`);
    console.log('Users can now login with their email and this password.');
    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAllPasswords();


