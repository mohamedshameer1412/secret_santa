const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const User = require('./models/User');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function prompt(question, fallback) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer || fallback);
        });
    });
}

async function resetAdmin(email, password) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        let admin = await User.findOne({ role: 'admin' });
        if (admin) {
            admin.email = email;
            admin.password = password;
            admin.isVerified = true;
            await admin.save();
            console.log('Admin password reset!');
        } else {
            admin = new User({
                name: 'Santa Admin',
                username: 'admin',
                email,
                password,
                isVerified: true,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created!');
        }
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (err) {
		console.error('Error resetting admin:', err);
    } finally {
        await mongoose.disconnect();
        rl.close();
    }
}

(async () => {
    let [,, email, password] = process.argv;
    if (!email) {
        email = await prompt('Enter admin email (default: santa@example.com): ', 'santa@example.com');
    }
    if (!password) {
        password = await prompt('Enter admin password (default: secret123): ', 'secret123');
    }
    await resetAdmin(email, password);
})();