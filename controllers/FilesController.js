import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

exports.postUpload = async (req, res) => {
    const token = req.headers['x-token'];
  
    // Retrieve the user based on the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Convert userId string to ObjectId
    const userObjectId = new ObjectId(userId);
    const user = await (await dbClient.allUsersCollection()).findOne({ _id: userObjectId });
    const { name, type, parentId = 0, isPublic = false, data } = req.body;
  
    // Validate the request payload
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type))
      return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });
  
    // Check if parentId is set and not 0
    let parentFile = null;
    const parentObjectId = new ObjectId(parentId);
    if (parentId !== 0) {
      parentFile = await (await dbClient.allFilesCollection()).findOne({ _id: parentObjectId });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }
  
    // Create the file object
    const fileDocument = {
      //userId: dbClient.convertToObjectId(userId),user._id.toString()
      userId: user._id.toString(),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? '0' : parentFile._id.toString(),
    };
  
    if (type === 'folder') {
      // Save the folder to the database
      const newFile = await (await dbClient.allFilesCollection()).insertOne(fileDocument);
      return res.status(201).json({
        id: newFile.insertedId,
        userId: fileDocument.userId,
        name,
        type,
        isPublic,
        parentId: fileDocument.parentId,
      });
    } else {
      // Store the file locally
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  
      const localPath = path.join(folderPath, uuidv4());
      const decodedData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, decodedData);
  
      fileDocument.localPath = localPath;
  
      // Save the file to the database
      const newFile = await (await dbClient.allFilesCollection()).insertOne(fileDocument);
      return res.status(201).json({
        id: newFile.insertedId,
        userId: fileDocument.userId,
        name,
        type,
        isPublic,
        parentId: fileDocument.parentId,
        localPath: fileDocument.localPath,
      });
    }
  };



exports.getShow = async (req, res) => {
    const id  = req.params.id;
    const token = req.headers['x-token'];

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
        return res.status(401).json({
            error : "Unauthorized"
        });
    }
    const fileObjectId = new ObjectId(id);
    const userObjectId = new ObjectId(userId);
    console.log(fileObjectId, userObjectId)
    const file = await (await dbClient.allFilesCollection()).findOne({
        _id: fileObjectId,
        userId: userObjectId });
    console.log(file)
    if (!file) {
        return res.status(404).json({error: "Not found"})
    }
    
    return res.status(200).json(file)
    
};

exports.getIndex = async (req, res) => {
    const token = req.headers['x-token'];

  // Retrieve the user based on the token
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parentId = req.query.parentId || '0';  // Default parentId to root
  const page = parseInt(req.query.page, 10) || 0;  // Default to page 0
  const limit = 20;  // Max 20 items per page

  try {
    // Query for file documents based on parentId and user ownership
    const query = {
      parentId,
      userId: dbClient.convertToObjectId(userId),
    };

    const files = await (await dbClient.allFilesCollection())
      .find(query)
      .skip(page * limit)  // Skip based on page
      .limit(limit)  // Limit to 20 files
      .toArray();

    return res.status(200).json(files);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};