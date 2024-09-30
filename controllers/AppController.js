import redisClient from '../utils/redis';
import dbClient from '../utils/db';

exports.getStatus = (req, res) => {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();

    res.status(200).json({
        "redis": redisAlive,
        "db": dbAlive
    })
};

exports.getStats = (req, res) => {

    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
      .then(([allUsers, allFiles]) => {
        res.status(200).json({ users: allUsers, files: allFiles });
      });
  };


