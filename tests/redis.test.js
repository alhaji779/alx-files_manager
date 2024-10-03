import redisClient from '../utils/redis';

describe('redisClient', () => {
  it('should return true when Redis is alive', () => {
    const isAlive = redisClient.isAlive();
    expect(isAlive).toBe(true);
  });

  it('should get and set values correctly', async () => {
    await redisClient.set('test_key', 'test_value', 60);
    const value = await redisClient.get('test_key');
    expect(value).toBe('test_value');
  });

  it('should delete values correctly', async () => {
    await redisClient.set('delete_key', 'to_be_deleted', 60);
    await redisClient.del('delete_key');
    const value = await redisClient.get('delete_key');
    expect(value).toBe(null);
  });
});