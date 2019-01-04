'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');
const log = require('../libs/log');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { journalId, readingId } = event.queryStringParameters;
  try {
    const result = await cloudwatch.trackExecTime('MongoDBFindOneLatency', () => new Promise((resolve, reject) => getDB()
      .collection(readingCollectionName)
      .findOne({ _id: new ObjectId(readingId), user_id: context.user._id }, { journal_entries: 1 })
      .then((reading, err) => {
        if (err) reject(err);
        else reading.journal_entries.forEach(journal => {
          if (journal._id.toString() === journalId) resolve(journal);
        });
      })));

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result),
    });
  } catch (error) {
    log.error(`Error message from fetch-journal-by-ids: ${error}`);
    callback(null, {
      statusCode: 500,
    });
  }
};

module.exports.handler = wrapper(handler);
