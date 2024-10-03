/**
 * This module test all the endpoints created so far
 * We used chai and sinon for the test
 */


import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';


chai.use(chaiHttp);
const { expect } = chai;

describe('API Endpoints', () => {
  let token = null;

  // Mocking Redis and DB clients if needed
  before(async () => {
    // Log in the user before running tests and get token
    const loginRes = await chai
      .request(app)
      .get('/connect')
      .auth('bob@dylan.com', 'toto1234!');
    token = loginRes.body.token;
  });

  afterEach(() => {
    sinon.restore(); // Restores mocked functions after each test
  });

  // GET /status
  it('should get the status of Redis and DB', (done) => {
    chai.request(app)
      .get('/status')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('redis');
        expect(res.body).to.have.property('db');
        done();
      });
  });

  // GET /stats
  it('should get the user and file stats', (done) => {
    sinon.stub(dbClient, 'nbUsers').resolves(10);
    sinon.stub(dbClient, 'nbFiles').resolves(5);

    chai.request(app)
      .get('/stats')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('users', 10);
        expect(res.body).to.have.property('files', 5);
        done();
      });
  });

  // POST /users
  it('should create a new user', (done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'newuser@example.com', password: 'password123' })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email', 'newuser@example.com');
        done();
      });
  });

  // GET /connect
  it('should log in the user and return a token', (done) => {
    chai.request(app)
      .get('/connect')
      .auth('bob@dylan.com', 'toto1234!')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  // GET /disconnect
  it('should log out the user', (done) => {
    chai.request(app)
      .get('/disconnect')
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(204);
        done();
      });
  });

  // GET /users/me
  it('should return current user data', (done) => {
    chai.request(app)
      .get('/users/me')
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email', 'bob@dylan.com');
        done();
      });
  });

  // POST /files
  it('should upload a file', (done) => {
    chai.request(app)
      .post('/files')
      .set('X-Token', token)
      .send({
        name: 'testfile.txt',
        type: 'file',
        isPublic: true,
        data: Buffer.from('Hello World').toString('base64')
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('name', 'testfile.txt');
        done();
      });
  });

  // GET /files/:id
  it('should retrieve a file by id', (done) => {
    chai.request(app)
      .post('/files')
      .set('X-Token', token)
      .send({
        name: 'testfile.txt',
        type: 'file',
        isPublic: true,
        data: Buffer.from('Hello World').toString('base64')
      })
      .end((err, uploadRes) => {
        const fileId = uploadRes.body.id;

        chai.request(app)
          .get(`/files/${fileId}`)
          .set('X-Token', token)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('id', fileId);
            done();
          });
      });
  });

  // GET /files with pagination
  it('should retrieve files with pagination', (done) => {
    chai.request(app)
      .get('/files')
      .set('X-Token', token)
      .query({ parentId: '0', page: 0 })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  // PUT /files/:id/publish
  it('should publish a file', (done) => {
    chai.request(app)
      .post('/files')
      .set('X-Token', token)
      .send({
        name: 'testfile.txt',
        type: 'file',
        isPublic: false,
        data: Buffer.from('Hello World').toString('base64')
      })
      .end((err, uploadRes) => {
        const fileId = uploadRes.body.id;

        chai.request(app)
          .put(`/files/${fileId}/publish`)
          .set('X-Token', token)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('isPublic', true);
            done();
          });
      });
  });

  // PUT /files/:id/unpublish
  it('should unpublish a file', (done) => {
    chai.request(app)
      .post('/files')
      .set('X-Token', token)
      .send({
        name: 'testfile.txt',
        type: 'file',
        isPublic: true,
        data: Buffer.from('Hello World').toString('base64')
      })
      .end((err, uploadRes) => {
        const fileId = uploadRes.body.id;

        chai.request(app)
          .put(`/files/${fileId}/unpublish`)
          .set('X-Token', token)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('isPublic', false);
            done();
          });
      });
  });

  // GET /files/:id/data
  it('should retrieve file data', (done) => {
    chai.request(app)
      .post('/files')
      .set('X-Token', token)
      .send({
        name: 'testfile.txt',
        type: 'file',
        isPublic: true,
        data: Buffer.from('Hello World').toString('base64')
      })
      .end((err, uploadRes) => {
        const fileId = uploadRes.body.id;

        chai.request(app)
          .get(`/files/${fileId}/data`)
          .set('X-Token', token)
          .end((err, res) => {
            expect(res).to.have.status(200);
            done();
          });
      });
  });
});