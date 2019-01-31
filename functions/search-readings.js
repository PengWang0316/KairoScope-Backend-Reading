'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('../libs/MongoDBHelper');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const searchForReadings = require('./libs/search-for-readings');

const {
  hexagramCollectionName, ADMINISTRATOR_ROLE,
} = process.env;

const handler = async (event, context, callback) => {
  const query = JSON.parse(event.queryStringParameters.searchCriterias);
  if (context.user.role * 1 !== ADMINISTRATOR_ROLE * 1) query.userId = context.user._id;

  const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => new Promise((resolve, reject) => {
    if (query.upperId !== 0 || query.lowerId !== 0
      || query.line13Id !== 0 || query.line25Id !== 0 || query.line46Id !== 0) {
      const queryObject = {};
      if (query.upperId !== 0) queryObject.upper_trigrams_id = new ObjectId(query.upperId);
      if (query.lowerId !== 0) queryObject.lower_trigrams_id = new ObjectId(query.lowerId);
      if (query.line13Id !== 0) queryObject.line_13_id = new ObjectId(query.line13Id);
      if (query.line25Id !== 0) queryObject.line_25_id = new ObjectId(query.line25Id);
      if (query.line46Id !== 0) queryObject.line_46_id = new ObjectId(query.line46Id);
      getDB().collection(hexagramCollectionName)
        .find(queryObject, { projection: { _id: 0, img_arr: 1 } }).toArray((err, results) => {
          searchForReadings(query, returnResult => resolve(returnResult), results);
        });
    } else searchForReadings(query, returnResult => resolve(returnResult));
  }));

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(result),
  });
};

module.exports.handler = wrapper(handler);
