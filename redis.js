const redis = require('redis');

const redisClient = redis.createClient(process.env.redis_port);

module.exports = redisClient;