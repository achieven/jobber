"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectionOptions = getConnectionOptions;
function getConnectionOptions() {
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
//# sourceMappingURL=redis.config.js.map