import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TextToVectorService {
    constructor(private readonly redisService: RedisService) {}

    async checkTextCacheHit(text: string): Promise<string | null> {
        console.log('redis get', text);
        return await this.redisService.get(text);
    }

    async setTextCache(text: string): Promise<void> {
        console.log('redis set', text);
        await this.redisService.set(text, String(true));
    }
}
