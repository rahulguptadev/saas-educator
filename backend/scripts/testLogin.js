const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function testLogin() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected\n');

    // Test with a teacher
    const testEmail = 'anshugupta@gmail.com';
    const testPassword = 'password123';

    console.log(`Testing login for: ${testEmail}`);
    console.log(`Password: ${testPassword}\n`);

    // Find user
    const user = await User.findOne({ email: testEmail }).select('+password');
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('✓ User found:');
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Is Active: ${user.isActive}`);
    console.log(`  Has Password: ${user.password ? 'Yes' : 'No'}`);
    console.log(`  Password Length: ${user.password ? user.password.length : 0}`);
    console.log(`  Password Preview: ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}\n`);

    // Test password comparison
    if (user.password) {
      const isMatch = await user.comparePassword(testPassword);
      console.log(`Password Match: ${isMatch ? '✓ YES' : '✗ NO'}`);
      
      if (!isMatch) {
        console.log('\n⚠️  Password does not match!');
        console.log('This could mean:');
        console.log('1. Password was not hashed correctly during import');
        console.log('2. Password was set incorrectly');
        console.log('3. Password needs to be reset\n');
        
        // Try to reset password
        console.log('Attempting to reset password...');
        user.password = testPassword; // This will trigger the pre-save hook to hash it
        await user.save();
        console.log('✓ Password reset. Try logging in again.\n');
        
        // Test again
        const user2 = await User.findOne({ email: testEmail }).select('+password');
        const isMatch2 = await user2.comparePassword(testPassword);
        console.log(`Password Match After Reset: ${isMatch2 ? '✓ YES' : '✗ NO'}`);
      }
    } else {
      console.log('❌ User has no password set!');
      console.log('Setting password...');
      user.password = testPassword;
      await user.save();
      console.log('✓ Password set. Try logging in again.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();


