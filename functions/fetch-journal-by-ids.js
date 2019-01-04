'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { journalId, readingId } = event.queryStringParameters;
  const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => new Promise((resolve, reject) => getDB()
    .collection(readingCollectionName)
    .findOne({ _id: new ObjectId(readingId), user_id: context.user._id }, { journal_entries: 1 })
    .then((readings, err) => {
      if (err) reject(err);
      else readings.journal_entries.forEach(journal => {
        if (journal._id.toString() === journalId) resolve(journal);
      });
    })));

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(result),
  });
};

module.exports.handler = wrapper(handler);
