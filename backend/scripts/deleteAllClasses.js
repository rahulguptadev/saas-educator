const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Class = require('../models/Class');

dotenv.config();

async function deleteAllClasses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jitsi-classroom');
    console.log('MongoDB Connected');

    // Delete all classes
    const result = await Class.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} classes`);

    process.exit(0);
  } catch (error) {
    console.error('Error deleting classes:', error);
    process.exit(1);
  }
}

deleteAllClasses();

