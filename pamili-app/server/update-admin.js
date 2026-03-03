const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pamili';

async function updateAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD;

        if (!password) {
            console.error('❌ Error: ADMIN_PASSWORD is not set in .env');
            process.exit(1);
        }

        // Find and update or create
        let admin = await Admin.findOne({ username });

        if (admin) {
            admin.password = password; // The 'save' middleware will hash this automatically
            await admin.save();
            console.log(`🚀 Admin password updated for: ${username}`);
        } else {
            admin = new Admin({ username, password });
            await admin.save();
            console.log(`✨ New Admin account created: ${username}`);
        }

        await mongoose.disconnect();
        console.log('✅ Done!');
    } catch (err) {
        console.error('❌ Error updating admin:', err.message);
        process.exit(1);
    }
}

updateAdmin();
