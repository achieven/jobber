// shared/redis-config.ts

import { ConnectionOptions } from 'bullmq';
import { RegisterQueueOptions } from '@nestjs/bullmq';

/**
 * Returns the BullMQ connection options based on environment variables.
 * @param env The environment variables object (e.g., process.env).
 * @returns ConnectionOptions for BullMQ.
 */
export function getConnectionOptions(): ConnectionOptions {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');

    if (!redisHost || isNaN(redisPort)) {
        throw new Error('REDIS_HOST and REDIS_PORT must be defined in environment variables for Redis connection.');
    }

    console.log(`Connecting to Redis at: ${redisHost}:${redisPort}`);

    return {
        host: redisHost,
        port: redisPort,
    };
}