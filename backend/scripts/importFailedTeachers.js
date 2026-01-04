const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

// Failed teacher records from CSV
const failedTeachers = [
  {
    name: 'Roopinder Kaur',
    email: 'roopinderkaur@gmail.com',
    phone: '8802009228',
    password: 'password123',
    role: 'teacher',
    specialization: 'Maths',
    qualification: 'B.A. B.Ed',
    education: '',
    bio: '',
    subjects: 'Maths',
    isActive: true
  },
  {
    name: 'Divya Goel',
    email: 'divyagoel@gmail.com',
    phone: '9971083433',
    password: 'password123',
    role: 'teacher',
    specialization: 'Maths',
    qualification: 'MCA PGDM(bankin g and finance) B.Ed',
    education: '',
    bio: 'subject expert of Maths, Commerce, Accounts and Business studies',
    subjects: 'Maths',
    isActive: true
  },
  {
    name: 'Arpita Das Ray',
    email: 'arpitadasray@gmail.com',
    phone: '8345015959',
    password: 'password123',
    role: 'teacher',
    specialization: 'Maths',
    qualification: 'M.Sc.Maths, M.Ed.',
    education: '',
    bio: 'working as TGT Maths in Govt. School of West Bangal, worked 6 years in DPS Burdwan',
    subjects: 'Maths',
    isActive: true
  },
  {
    name: 'Ritika Garg',
    email: 'ritikagarg@gmail.com',
    phone: '8219678020',
    password: 'password123',
    role: 'teacher',
    specialization: 'Maths',
    qualification: 'B.Com, D.El.Ed, TET',
    education: '',
    bio: 'working as TGT Maths in DPS Manali. Experience 22 years',
    subjects: 'Maths',
    isActive: true
  },
  {
    name: 'Sunaina Aggarwal',
    email: 'sunainaaggarwal@gmail.com',
    phone: '9467947792',
    password: 'password123',
    role: 'teacher',
    specialization: 'Hindi',
    qualification: 'M.Com B.Ed.',
    education: '',
    bio: '12 years of experience. I specialize in teaching and tutoring, focusing of delivering comprehensive and effecticve education qacross variouse grade leveles',
    subjects: 'Hindi',
    isActive: true
  }
];

async function importFailedTeachers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected\n');

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const teacherData of failedTeachers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: teacherData.email.toLowerCase() });
        
        if (existingUser) {
          console.log(`⚠️  ${teacherData.email}: Already exists (skipping)`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(teacherData.password, 10);
        
        // Create user
        const user = await User.create({
          ...teacherData,
          email: teacherData.email.toLowerCase(),
          password: hashedPassword
        });

        console.log(`✅ ${teacherData.email}: Created successfully (${user.name})`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${teacherData.email}: ${error.message}`);
        errors.push(`${teacherData.email}: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (errors.length > 0) {
      console.log(`\nErrors:`);
      errors.forEach(err => console.log(`  - ${err}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importFailedTeachers();

