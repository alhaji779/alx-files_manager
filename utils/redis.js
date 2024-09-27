/**
 * This class confirms a redis connection
 */
import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient{
    constructor(){
        this.client = createClient();
        this.connectSuccess = true;
        this.client.on('connect', () => {
            this.connectSuccess = true;
        });
        this.client.on('error', (err) => {
            console.error('Redis client connection error:', err.message || err.toString());
            this.connectSuccess = false;
        });
    };

    isAlive() {
        return this.connectSuccess;
    };

    async get(key) {
        return promisify(this.client.GET).bind(this.client)(key);
    };

    async set(key, value, time) {
        await promisify(this.client.SETEX).bind(this.client)(key, time,value);
    };

    async del(key) {
        await promisify(this.client.DEL).bind(this.client)(key);
    }
};

export const redisClient = new RedisClient();
export default redisClient;
