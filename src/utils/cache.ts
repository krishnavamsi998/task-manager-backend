import { getRedisClient } from '../config/redis';

const CACHE_TTL = 300; // 5 minutes

export const getCacheKey = (userId: string): string => `tasks:${userId}`;

export const getCachedTasks = async (userId: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    const key = getCacheKey(userId);
    return await client.get(key);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const setCachedTasks = async (userId: string, data: unknown): Promise<void> => {
  try {
    const client = getRedisClient();
    const key = getCacheKey(userId);
    await client.setex(key, CACHE_TTL, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

export const invalidateTaskCache = async (userId: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const key = getCacheKey(userId);
    await client.del(key);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};