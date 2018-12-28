'use strict';

const wrapper = require('../middlewares/wrapper');
const { promiseFindResult } = require('../libs/MongoDBHelper');
const verifyJWT = require('../libs/VerifyJWT');
const log = require('../libs/log');
const cloudwatch = require('../libs/cloudwatch');

const { readingCollectionName, jwtName } = process.env;

const handler = async (event, context, callback) => {
  const user = event.queryStringParameters
    ? verifyJWT(event.queryStringParameters[jwtName], context.jwtSecret)
    : false;

  if (user) {
    const { numberPerpage } = event.queryStringParameters;
    const pageNumber = event.queryStringParameters.pageNumber === undefined ? 0 : event.queryStringParameters.pageNumber;
    const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => promiseFindResult(db => db
      .collection(readingCollectionName)
      .find({ user_id: user._id }, { reading_name: 1, date: 1 })
      .skip(pageNumber * numberPerpage).limit(numberPerpage * 1)
      .sort({ date: -1 })));
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result),
    });
  } else {
    log.info('Invalid user tried to call fetch-all-reading-list');
    callback(null, { body: 'Invalid User' });
  }
};

module.exports.handler = wrapper(handler);
