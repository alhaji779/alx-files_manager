import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import sha1 from 'sha1';


exports.getConnect = async (req, res) => {
    // Retrieve the 'Authorization' header
  const authHeader = req.headers.authorization || '';
  
  if (!authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Decode the base64 encoded string
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [email, password] = credentials.split(':');

  // Check if email or password is missing
  if (!email || !password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find the user in the database
    const user = await (await dbClient.allUsersCollection()).findOne({ email, password: sha1(password) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a token using uuid
    const token = uuidv4();
    const key = `auth_${token}`;

    // Store the token in Redis with an expiration time of 24 hours (24 * 60 * 60 seconds)
    await redisClient.set(key, user._id.toString(), 24 * 60 * 60);

    // Return the token to the client
    return res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


exports.getDisconnect = async (req, res) => {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    await redisClient.del(key);
    return res.status(204).send();
}