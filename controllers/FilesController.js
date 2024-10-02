import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { error } from 'console';
import Bull from 'bull';

const fileQueue = new Bull('fileQueue');

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

      // If the file is an image, add a job to the fileQueue to generate thumbnails
      if (type === 'image') {
        await fileQueue.add({ userId, fileId: newFile.insertedId });
      }

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
      .findOne(query)
      .skip(page * limit)  // Skip based on page
      .limit(limit)  // Limit to 20 files
      .toArray();

    return res.status(200).json(files);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.putPublish = async (req, res) => {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized"});
    }

    const file = await (await dbClient.allFilesCollection()).findOne({
        _id: new ObjectId(fileId),
        userId: new ObjectId(user)
    });
    if(!file) {
        return res.status(404).json({ error: "Not found"});
    };

    // Update the isPublic field to true
    await (await dbClient.allFilesCollection()).updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { isPublic: true } }
      );
  
    const updatedFile = await (await dbClient.allFilesCollection()).findOne({ _id: new ObjectId(fileId) });
  
    return res.status(200).json(updatedFile);
}



exports.putUnpublish = async (req, res) => {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized"});
    }

    const file = await (await dbClient.allFilesCollection()).findOne({
        _id: new ObjectId(fileId),
        userId: new ObjectId(user)
    });
    if(!file) {
        return res.status(404).json({ error: "Not found"});
    };

    // Update the isPublic field to false
    await (await dbClient.allFilesCollection()).updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { isPublic: false } }
      );
  
    const updatedFile = await (await dbClient.allFilesCollection()).findOne({ _id: new ObjectId(fileId) });
  
    return res.status(200).json(updatedFile);
};


exports.getFile = async (req, res) => {
    const token = req.headers['x-token'] || null;
    const fileId = req.params.id;
    const size = req.query.size;

    try {
        // Find the file document by ID
        const file = await (await dbClient.allFilesCollection()).findOne({ _id: new ObjectId(fileId) });
    
        if (!file) {
          return res.status(404).json({ error: 'Not found' });
        }
    
        // If the file type is a folder, return an error
        if (file.type === 'folder') {
          return res.status(400).json({ error: "A folder doesn't have content" });
        }
    
        // Check if the file is public or if the user is authenticated and the owner
        if (!file.isPublic) {
          if (!token) {
            return res.status(404).json({ error: 'Not found' });
          }
    
          // Retrieve the user based on the token
          const userId = await redisClient.get(`auth_${token}`);
          if (!userId || userId !== file.userId.toString()) {
            return res.status(404).json({ error: 'Not found' });
          }
        }

        // Determine the correct file path based on the size parameter
        let filePath = file.localPath;
        if (size && ['500', '250', '100'].includes(size)) {
        filePath = `${file.localPath}_${size}`;
        }
    
        // Check if the file exists locally
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Not found' });
        }
    
        // Get the MIME type of the file using mime-types module
        const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    
        // Read and return the file content with the correct MIME type
        const fileContent = fs.readFileSync(file.localPath);
        res.setHeader('Content-Type', mimeType);
        return res.status(200).send(fileContent);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
};