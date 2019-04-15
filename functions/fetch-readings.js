'use strict';

const { getDB } = require('@kevinwang0316/mongodb-helper');
const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const wrapper = require('../middlewares/wrapper');
const findHexagramImages = require('./libs/find-hexagram-images');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { pageNumber, numberPerpage } = event.queryStringParameters;
  const {
    user, redisHost, redisPort, redisPassword,
  } = context;
  const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => new Promise((resolve, reject) => {
    getDB().collection(readingCollectionName)
      .find(user.role * 1 === process.env.ADMINISTRATOR_ROLE * 1 ? {} : { user_id: user._id })
      .sort({ date: -1 })
      .limit(numberPerpage * 1)
      .skip(pageNumber * numberPerpage)
      .toArray((err, readingResult) => {
        if (err) {
          log.error(`Reading getRecentReadings something goes worry: ${err}`);
          resolve({});
        } else if (readingResult.length !== 0) findHexagramImages(
          redisHost, redisPort, redisPassword, readingResult, backResult => resolve(backResult),
        ); else resolve(readingResult);
      });
  }));
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(result),
  });
};

module.exports.handler = wrapper(handler);
