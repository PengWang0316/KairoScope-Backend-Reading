'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { promiseInsertResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('@kevinwang0316/cloudwatch');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { readingId } = event.queryStringParameters;
  await cloudwatch.trackExecTime('MongoDbDeleteOneLatancy', () => promiseInsertResult(db => db
    .collection(readingCollectionName)
    .deleteOne({
      _id: new ObjectId(readingId),
      user_id: context.user._id,
    })));

  callback(null, {
    statusCode: 200,
    // body: {},
  });
};
module.exports.handler = wrapper(handler);
