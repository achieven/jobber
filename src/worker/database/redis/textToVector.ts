import { Redis } from 'ioredis';

const redis = new Redis();

export async function checkTextCacheHit(text: string) {
    console.log('redis get', text)
    const vector = await redis.get(text);
    return vector;
}

export async function setTextCache(text: string, value: Boolean) {
    console.log('redis set')
    await redis.set(text, String(value));
}