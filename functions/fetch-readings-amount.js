'use strict';

const wrapper = require('../middlewares/wrapper');
const mongodb = require('../libs/MongoDBHelper');
const verifyJWT = require('../libs/VerifyJWT');
const log = require('../libs/log');
const cloudwatch = require('../libs/cloudwatch');

const { readingCollectionName, jwtName } = process.env;

const handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await mongodb.initialConnects(context.dbUrl, context.dbName);
  const user = event.queryStringParameters
    ? verifyJWT(event.queryStringParameters[jwtName], context.jwtSecret)
    : false;

  if (user) {
    const result = await cloudwatch.trackExecTime('MongoDBCountLatency', () => mongodb.promiseReturnResult(db => db
      .collection(readingCollectionName)
      .countDocuments({ user_id: user._id })));
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result),
    });
  } else {
    log.info('Invalid user tried to call fetch-readings-amount');
    callback(null, { body: 'Invalid User' });
  }
};

module.exports.handler = wrapper(handler);
