const mongoose = require('mongoose');
const Product = require('../server/models/Product');
const Store = require('../server/models/Store');
require('dotenv').config();

async function testAggregation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pamili');
        console.log('Connected to DB');

        const store = await Store.findOne();
        if (!store) {
            console.log('No store found. Please add a store first.');
            process.exit(1);
        }

        console.log(`Testing with store: ${store.name} (${store._id})`);

        // 1. Create several submissions at different times
        const submissions = [
            { crowdLevel: 'high', hour: 10 },
            { crowdLevel: 'high', hour: 10 },
            { crowdLevel: 'low', hour: 20 },
        ];

        for (const sub of submissions) {
            const date = new Date();
            date.setHours(sub.hour);

            const p = await Product.create({
                name: `Test Product ${Date.now()}`,
                status: 'pending',
                crowdLevel: sub.crowdLevel,
                submittedDate: date.toISOString(),
                prices: [{
                    storeId: store._id,
                    storeName: store.name,
                    price: 10,
                    inStock: true,
                    lastUpdated: new Date().toISOString().split('T')[0]
                }]
            });
            console.log(`Created pending submission: ${sub.crowdLevel} at ${sub.hour}:00`);
        }

        console.log('\nNow go to the Admin page and approve these submissions.');
        console.log('Or use the API PATCH /api/admin/products/:id/approve');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testAggregation();
