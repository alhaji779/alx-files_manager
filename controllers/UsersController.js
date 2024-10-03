/* eslint-disable import/no-named-as-default */
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import Bull from 'bull';

const userQueue = new Bull('userQueue');

exports.postNew = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email) {
        res.status(400).json({ error: 'Missing email' });
        return;
      }
      if (!password) {
        res.status(400).json({ error: 'Missing password' });
        return;
      }
  
      const user = await (await dbClient.allUsersCollection()).findOne({ email });
  
      if (user) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }
  
      const newUser = await (await dbClient.allUsersCollection())
        .insertOne({ email, password: sha1(password) });
      const userId = newUser.insertedId.toString();

      // enable a job in the userQueue with the userId
      userQueue.add({ userId });
  
      res.status(201).json({ id: userId, email  });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  exports.getMe = async (req, res) => {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Convert userId string to ObjectId
    const userObjectId = new ObjectId(userId);
    const user = await (await dbClient.allUsersCollection()).findOne({ _id: userObjectId });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id.toString(), email: user.email });
  }
