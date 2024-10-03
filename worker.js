import Bull from 'bull';
import dbClient from './utils/db';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import path from 'path';

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await (await dbClient.allFilesCollection()).findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  if (!file) throw new Error('File not found');

  const originalPath = file.localPath;
  const thumbnailSizes = [500, 250, 100];

  for (const size of thumbnailSizes) {
    try {
      const thumbnail = await imageThumbnail(originalPath, { width: size });
      const thumbnailPath = `${originalPath}_${size}`;

      fs.writeFileSync(thumbnailPath, thumbnail);
    } catch (err) {
      console.error(`Error generating thumbnail for size ${size}:`, err);
    }
  }
});


// Process the userQueue
userQueue.process(async (job, done) => {
    const { userId } = job.data;
  
    if (!userId) {
      return done(new Error('Missing userId'));
    }
  
    // Find the user in the database
    const userObjectId = new ObjectId(userId);
    const usersCollection = await dbClient.allUsersCollection();
    const user = await usersCollection.findOne({ _id: userObjectId });
  
    if (!user) {
      return done(new Error('User not found'));
    }
  
    // Simulate sending a welcome email by printing a message
    console.log(`Welcome ${user.email}!`);
  
    done();
  });
