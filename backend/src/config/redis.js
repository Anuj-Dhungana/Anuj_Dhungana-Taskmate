import Redis from 'ioredis';

let client = null;

/**
 * Singleton Redis client. Set REDIS_URL (e.g. redis://127.0.0.1:6379 or rediss://... for cloud).
 */
export const getRedis = () => {
    if (!client) {
        const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        const options = {
            maxRetriesPerRequest: null,
        };

        // Cloud Redis providers (Upstash, Redis Cloud) use rediss:// and require TLS
        if (url.startsWith('rediss://')) {
            options.tls = { rejectUnauthorized: false };
        }

        client = new Redis(url, options);
        client.on('error', (err) => {
            console.error('[Redis]', err.message);
        });
    }
    return client;
};
