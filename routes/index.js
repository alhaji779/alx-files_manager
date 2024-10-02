const express = require('express');
const router = express.Router();
const { getStatus, getStats } = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect} = require('../controllers/AuthController');
const { postUpload, getShow, getIndex } = require('../controllers/FilesController')


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

//retrive user
router.get('/files/:id', getShow);

//retrive user
router.get('/files', getIndex);



module.exports = router;

