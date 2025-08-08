import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { getConnectionOptions } from './redis.config';

@Injectable()
export class RedisService {
    private redis: Redis;

    constructor() {
        const {host, port}  = getConnectionOptions();
        this.redis = new Redis(port, host);
    }

    async get(key: string): Promise<string | null> {
        return await this.redis.get(key);
    }

    async set(key: string, value: string): Promise<void> {
        await this.redis.set(key, value);
    }
}
