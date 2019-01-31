'use strict';

const wrapper = require('../middlewares/wrapper');
const mongodb = require('../libs/MongoDBHelper');
const cloudwatch = require('@kevinwang0316/cloudwatch');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const result = await cloudwatch.trackExecTime('MongoDBCountLatency', () => mongodb.promiseReturnResult(db => db
    .collection(readingCollectionName)
    .countDocuments({ user_id: context.user._id })));
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(result),
  });
};

module.exports.handler = wrapper(handler);
