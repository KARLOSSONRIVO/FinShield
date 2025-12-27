import moongoose from 'mongoose';
import { MONGO_URI } from '../../config/env.js';

export async function connectDB() {
    moongoose.set('strictQuery', true);
    try {
        await moongoose.connect(MONGO_URI, {
            autoIndex: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

export async function disconnectDB() {
    try {
        await moongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
}