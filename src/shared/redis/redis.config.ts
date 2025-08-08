export interface RedisConnectionOptions {
    host: string;
    port: number;
}

export function getConnectionOptions(): RedisConnectionOptions {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');

    if (!redisHost || isNaN(redisPort)) {
        throw new Error('REDIS_HOST and REDIS_PORT must be defined in environment variables for Redis connection.');
    }

    return {
        host: redisHost,
        port: redisPort,
    };
}