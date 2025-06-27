const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    // Drop each collection
    for (const collection of collections) {
      await collection.drop();
      console.log(`Dropped collection: ${collection.collectionName}`);
    }
    
    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error resetting database:', error);
    if (error.code !== 26) {
      console.error('Unexpected error:', error);
    }
  } finally {
    await mongoose.disconnect();
  }
}

resetDatabase();