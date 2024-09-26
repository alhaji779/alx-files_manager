# alx-files_manager
ALX FILE MANAGER PROJECT

# Project Name
**0x04. Files manager**

## Author's Details
Name: *Michael Kanu*

Email: *michaelokanu01@yahoo.com*

Tel: *+2348029714132.*

##  Requirements

### JavaScript Scripts
*   Allowed editors: `vi`, `vim`, `emacs`, `Visual Studio Code`.
*   All your files will be interpreted on Ubuntu 20.04 LTS using `node` (version 14.x).
*   All your files should end with a new line.
*   The `main.js` files are used to test your functions, but you don’t have to push them to your repo.
*   Your code will be analyzed using the linter [ESLint](https://eslint.org/) along with specific rules that will be provided.
*   When running every test with `npm run test *.test.js`, everything should pass correctly without any warning or error.
*   All of your functions must be exported.

## Project Description
Learn How to create an API with Express.
how to authenticate a user.
how to store data in MongoDB.
how to store temporary data in Redis.
how to setup and use a background worker.

## More Info
### Install Node 14
```
$ curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
$ sudo apt-get install -y nodejs
```

### Install Jest, Babel, and ESLint
```
$ npm install --save-dev jest
$ npm install --save-dev babel-jest @babel/core @babel/preset-env
$ npm install --save-dev eslint
```

**Find the configuration files `package.json`, `babel.config.js` and `.eslintrc.js` in the project directory. Run `npm install` when you have the `package.json`**

#### Step 0
Inside the folder utils, create a file redis.js that contains the class RedisClient.

RedisClient should have:

 * the constructor that creates a client to Redis:
      any error of the redis client must be displayed in the console (you should use on('error') of the redis client)
 * a function isAlive that returns true when the connection to Redis is a success otherwise, false
 * an asynchronous function get that takes a string key as argument and returns the Redis value stored for this key
 * an asynchronous function set that takes a string key, a value and a duration in second as arguments to store it in Redis (with an 
    expiration set by the duration argument)
 * an asynchronous function del that takes a string key as argument and remove the value in Redis for this key
After the class definition, create and export an instance of RedisClient called redisClient.

#### Step 1
Inside the folder utils, create a file db.js that contains the class DBClient.

DBClient should have:
 * the constructor that creates a client to MongoDB:
      * host: from the environment variable DB_HOST or default: localhost
      * port: from the environment variable DB_PORT or default: 27017
      * database: from the environment variable DB_DATABASE or default: files_manager
 * a function isAlive that returns true when the connection to MongoDB is a success otherwise, false
 * an asynchronous function nbUsers that returns the number of documents in the collection users
 * an asynchronous function nbFiles that returns the number of documents in the collection files
After the class definition, create and export an instance of DBClient called dbClient.

#### Step 2
Inside server.js, create the Express server:
 * it should listen on the port set by the environment variable PORT or by default 5000
 * it should load all routes from the file routes/index.js
Inside the folder routes, create a file index.js that contains all endpoints of our API:
 * GET /status => AppController.getStatus
 * GET /stats => AppController.getStats
Inside the folder controllers, create a file AppController.js that contains the definition of the 2 endpoints:
 * GET /status should return if Redis is alive and if the DB is alive too by using the 2 utils created previously: { "redis": true, "db": true } with a status code 200
 * GET /stats should return the number of users and files in DB: { "users": 12, "files": 1231 } with a status code 200
      * users collection must be used for counting all users
      * files collection must be used for counting all files


## Collaborate

To collaborate, reach me through my email address michaelokanu01@yahoo.com.
