"use strict";
/** @desc Redis connection */
const config = require("config");
const bluebird = require("bluebird");

/**
 * @type {Object}
 * @desc Redis configuration
 */
const _redisConfig = JSON.parse(JSON.stringify(config.get("redis")));

// Sanitize redis configuration
for (let i in _redisConfig) {
  if (i === _redisConfig[i]) {
    delete _redisConfig[i];
  }
}

/**
 * @type {redisMock|redis}
 * @desc Get the redis client to use.
 */
let redis;

try {
  if (_redisConfig.client !== "redis") {
    redis = require("redis-mock");
  } else {
    redis = require("redis");
  }
} catch (e) {
  console.log(e);
  redis = require("redis");
}

try {
  bluebird.promisifyAll(redis);
} catch (e) {
  console.log(e);
}

// Sanitize redis client configuration.
delete _redisConfig.client;

// Create redis client while exporting.
exports = module.exports = redis.createClient(_redisConfig); // eslint-disable-line no-global-assign

// Export redis client instance.
exports.redis = redis;
