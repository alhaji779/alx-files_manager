const express = require('express');
const router = express.Router();
const { getStatus, getStats } = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect} = require('../controllers/AuthController');
const { postUpload, getShow, getIndex, putPublish, putUnpublish, getFile } = require('../controllers/FilesController')


//get status
router.get('/status', getStatus);


//get stats
router.get('/stats', getStats);

//post newUser
router.post('/users', postNew);

//get cconnected user
router.get('/connect', getConnect);

//disconnect user
router.get('/disconnect', getDisconnect);

//retrive user
router.get('/users/me', getMe);

//create files/folder/image
router.post('/files', postUpload);

//retrive file
router.get('/files/:id', getShow);

//retrive file pagination
router.get('/files', getIndex);

//publish a file
router.put('/files/:id/publish', putPublish);

//unpublish a file
router.put('files/:id/unpublish', putUnpublish);

//get file
router.get('files/:id/data', getFile);



module.exports = router;

