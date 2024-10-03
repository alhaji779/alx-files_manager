import dbClient from '../utils/db';

describe('dbClient', () => {
  it('should return true when MongoDB is alive', () => {
    const isAlive = dbClient.isAlive();
    expect(isAlive).toBe(true);
  });

  it('should count users and files', async () => {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();

    expect(users).toBeGreaterThanOrEqual(0);
    expect(files).toBeGreaterThanOrEqual(0);
  });
});