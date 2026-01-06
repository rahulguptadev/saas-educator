const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function listLoginCredentials() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected\n');

    // Default password for imported users
    const defaultPassword = 'password123';

    console.log('='.repeat(80));
    console.log('LOGIN CREDENTIALS FOR IMPORTED USERS');
    console.log('='.repeat(80));
    console.log(`\nDefault Password for ALL imported users: ${defaultPassword}\n`);

    // Get all teachers
    const teachers = await User.find({ role: 'teacher' })
      .select('name email isActive')
      .sort({ name: 1 });

    console.log('='.repeat(80));
    console.log(`TEACHERS (${teachers.length} total)`);
    console.log('='.repeat(80));
    
    if (teachers.length === 0) {
      console.log('No teachers found.\n');
    } else {
      teachers.forEach((teacher, index) => {
        const status = teacher.isActive ? '✓ Active' : '✗ Inactive';
        console.log(`${index + 1}. ${teacher.name}`);
        console.log(`   Email: ${teacher.email}`);
        console.log(`   Password: ${defaultPassword}`);
        console.log(`   Status: ${status}`);
        console.log('');
      });
    }

    // Get all students
    const students = await User.find({ role: 'student' })
      .select('name email isActive')
      .sort({ name: 1 });

    console.log('='.repeat(80));
    console.log(`STUDENTS (${students.length} total)`);
    console.log('='.repeat(80));
    console.log('Note: Student emails were auto-generated from their names.\n');
    
    if (students.length === 0) {
      console.log('No students found.\n');
    } else {
      students.forEach((student, index) => {
        const status = student.isActive ? '✓ Active' : '✗ Inactive';
        console.log(`${index + 1}. ${student.name}`);
        console.log(`   Email: ${student.email}`);
        console.log(`   Password: ${defaultPassword}`);
        console.log(`   Status: ${status}`);
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('HOW TO LOGIN:');
    console.log('='.repeat(80));
    console.log('1. Go to the login page');
    console.log('2. Enter the email address shown above');
    console.log(`3. Enter password: ${defaultPassword}`);
    console.log('4. Click "Sign In"');
    console.log('\nNote: Users should change their password after first login for security.');
    console.log('='.repeat(80));

    // Export to CSV option
    console.log('\nWould you like to export credentials to CSV? (y/n)');
    console.log('(This will create a file with all login credentials)');
    
    // For now, just create the CSV file
    const fs = require('fs');
    const csvPath = '/Users/rahulg_1/Downloads/login-credentials.csv';
    
    let csvContent = 'Role,Name,Email,Password,Status\n';
    
    teachers.forEach(teacher => {
      csvContent += `Teacher,"${teacher.name}","${teacher.email}","${defaultPassword}","${teacher.isActive ? 'Active' : 'Inactive'}"\n`;
    });
    
    students.forEach(student => {
      csvContent += `Student,"${student.name}","${student.email}","${defaultPassword}","${student.isActive ? 'Active' : 'Inactive'}"\n`;
    });
    
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`\n✅ Credentials exported to: ${csvPath}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listLoginCredentials();


