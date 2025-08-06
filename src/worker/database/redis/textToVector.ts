import { Redis } from 'ioredis';

const redis = new Redis();

export async function getTextToVector(text: string) {
    console.log('redis get', text)
    const vector = await redis.get(text);
    return vector;
}

export async function setTextToVector(text: string, vector: number[]) {
    console.log('redis set')
    await redis.set(text, JSON.stringify(vector));
}