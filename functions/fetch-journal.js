'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('../libs/MongoDBHelper');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const log = require('@kevinwang0316/log');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { journalId } = event.queryStringParameters;
  try {
    const result = await cloudwatch.trackExecTime('MongoDbFindLatancy', () => new Promise((resolve, reject) => {
      getDB().collection(readingCollectionName)
        .find({
          user_id: context.user._id, 'journal_entries._id': new ObjectId(journalId),
        },
        {
          projection: {
            _id: 1, reading_name: 1, user_id: 1, journal_entries: 1,
          },
        })
        .toArray((err, readingResult) => {
        // Getting all reading ids
          if (err) reject(err);
          const readingIds = {};
          readingResult.forEach(reading => {
            readingIds[reading._id] = reading.reading_name;
          });
          // Finding the right journal and attaching the reading ids array to it.
          readingResult[0].journal_entries.forEach(element => {
            if (element._id.toString() === journalId) resolve({
              user_id: context.user._id, readingIds, ...element,
            });
          });
        });
    }));

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result),
    });
  } catch (err) {
    log.error(`${context.functionName} has error message: ${err}`);
    callback(null, { statusCode: 500 });
  }
};
module.exports.handler = wrapper(handler);
