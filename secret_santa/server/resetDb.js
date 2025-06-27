const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Import User model for seeding
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Command line arguments
const args = process.argv.slice(2);
const targetCollection = args[0];
const adminEmail = args[1];     // Optional admin email (second argument)
const adminPassword = args[2];  // Optional admin password (third argument)

async function resetDatabase() {
  try {
    // Safety confirmation
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
      const answer = await new Promise((resolve) => {
        rl.question('WARNING: You are about to reset the database. This action cannot be undone. Continue? (y/N) ', resolve);
      });
      
      if (answer.toLowerCase() !== 'y') {
        console.log('Database reset cancelled.');
        rl.close();
        return;
      }
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    if (targetCollection && targetCollection !== 'all') {
      // Reset specific collection
      const collection = collections.find(c => c.collectionName === targetCollection);
      if (collection) {
        // Additional confirmation for sensitive collections
        if (['users', 'events'].includes(targetCollection)) {
          const confirm = await new Promise((resolve) => {
            rl.question(`WARNING: You are about to drop the "${targetCollection}" collection which may contain important data. Are you sure? (y/N) `, resolve);
          });
          
          if (confirm.toLowerCase() !== 'y') {
            console.log(`${targetCollection} collection drop cancelled.`);
            rl.close();
            return;
          }
        }
        
        await collection.drop();
        console.log(`Dropped collection: ${collection.collectionName}`);
      } else {
        console.log(`Collection "${targetCollection}" not found.`);
      }
    } else {
      // Check if sensitive collections exist
      const hasUsers = collections.some(c => c.collectionName === 'users');
      const hasEvents = collections.some(c => c.collectionName === 'events');
      
      if (hasUsers || hasEvents) {
        const confirm = await new Promise((resolve) => {
          rl.question(`WARNING: You are about to drop ${hasUsers ? 'USERS' : ''}${hasUsers && hasEvents ? ' and ' : ''}${hasEvents ? 'EVENTS' : ''} collections. This will delete ALL user accounts and event data. Are you absolutely sure? (y/N) `, resolve);
        });
        
        if (confirm.toLowerCase() !== 'y') {
          console.log('Database reset cancelled to protect important data.');
          rl.close();
          return;
        }
      }
      
      // Reset all collections
      for (const collection of collections) {
        try {
          await collection.drop();
          console.log(`Dropped collection: ${collection.collectionName}`);
        } catch (error) {
          if (error.code === 26) {
            console.log(`Collection "${collection.collectionName}" is already empty.`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('Database reset complete!');
    
    // Prompt to seed with admin account
    const seedAnswer = await new Promise((resolve) => {
      rl.question('Would you like to create an admin user? (y/N) ', resolve);
    });
    
    if (seedAnswer.toLowerCase() === 'y') {
      await seedAdmin();
    }
    
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Function to seed admin user
async function seedAdmin() {
  try {
    // Get admin credentials from command line or prompt
    let email = adminEmail;
    let password = adminPassword;
    
    if (!email) {
      email = await new Promise((resolve) => {
        rl.question('Enter admin email (default: santa@example.com): ', (answer) => {
          resolve(answer || 'santa@example.com');
        });
      });
    }
    
    if (!password) {
      password = await new Promise((resolve) => {
        rl.question('Enter admin password (default: secret123): ', (answer) => {
          resolve(answer || 'secret123');
        });
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const adminUser = new User({
      name: 'Santa Admin',
      email: email,
      password: hashedPassword,
      isVerified: true,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('Admin user created:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

resetDatabase();