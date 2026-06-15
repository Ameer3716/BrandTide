import mongoose from 'mongoose';
import config from '../src/config/config.js';

async function clearDatabase() {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
    
    // Drop the entire database
    await mongoose.connection.db.dropDatabase();
    console.log('Successfully dropped the database.');
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
