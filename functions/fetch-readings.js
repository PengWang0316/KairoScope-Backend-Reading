'use strict';

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('../libs/MongoDBHelper');
const log = require('../libs/log');
const cloudwatch = require('../libs/cloudwatch');
const findHexagramImages = require('./libs/find-hexagram-images');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const userRole = context.user.role || 3; // Give a default role
  const { pageNumber, numberPerpage } = event.queryStringParameters;
  const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => new Promise((resolve, reject) => {
    getDB().collection(readingCollectionName)
      .find(userRole * 1 === process.env.ADMINISTRATOR_ROLE * 1 ? {} : { user_id: context.user._id })
      .sort({ date: -1 })
      .limit(numberPerpage * 1)
      .skip(pageNumber * numberPerpage)
      .toArray((err, readingResult) => {
        if (err) log.error('Reading getRecentReadings something goes worry: ', err);
        if (readingResult.length !== 0) findHexagramImages(readingResult, backResult => resolve(backResult));
        else resolve(readingResult);
      });
  }));
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(result),
  });
};

module.exports.handler = wrapper(handler);
