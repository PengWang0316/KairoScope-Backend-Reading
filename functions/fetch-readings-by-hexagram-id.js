'use strict';

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('@kevinwang0316/mongodb-helper');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const findHexagramImages = require('./libs/find-hexagram-images');

const { readingCollectionName, ADMINISTRATOR_ROLE } = process.env;

const handler = async (event, context, callback) => {
  const { imageArray } = event.queryStringParameters;
  const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => new Promise((resolve, reject) => {
    const queryObject = { $or: [{ hexagram_arr_1: imageArray }, { hexagram_arr_2: imageArray }] };
    if (context.user.role * 1 !== ADMINISTRATOR_ROLE * 1) queryObject.user_id = context.user._id;
    getDB().collection(readingCollectionName).find(queryObject).toArray((err, findResult) => {
      if (findResult.length !== 0) findHexagramImages(findResult, callbackResult => resolve(callbackResult));
      else resolve(findResult);
    });
  }));

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(result),
  });
};

module.exports.handler = wrapper(handler);
