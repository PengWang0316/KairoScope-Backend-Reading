'use strict';

const wrapper = require('../middlewares/wrapper');
const { promiseFindResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { numberPerpage } = event.queryStringParameters;
  const pageNumber = event.queryStringParameters.pageNumber === undefined ? 0 : event.queryStringParameters.pageNumber;
  const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => promiseFindResult(db => db
    .collection(readingCollectionName)
    .find({ user_id: context.user._id }, { reading_name: 1, date: 1 })
    .skip(pageNumber * numberPerpage).limit(numberPerpage * 1)
    .sort({ date: -1 })));
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(result),
  });
};

module.exports.handler = wrapper(handler);
