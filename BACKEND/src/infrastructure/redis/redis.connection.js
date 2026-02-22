import Redis from 'ioredis';
import { REDIS_URI } from '../../config/env.js';

// Create a single shared connection for BullMQ
// Setting maxRetriesPerRequest to null is required by BullMQ
const redisConnection = new Redis(REDIS_URI, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redisConnection.on('error', (err) => {
    console.error('Redis Error:', err);
});

redisConnection.on('connect', () => {
    console.log('✅ Connected to Redis successfully');
});

export default redisConnection;
