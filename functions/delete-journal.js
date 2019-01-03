'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { promiseInsertResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { journalId, readingIds } = JSON.parse(event.body);
  await cloudwatch.trackExecTime('MongoDbUpdateLatancy', () => promiseInsertResult(db => db
    .collection(readingCollectionName)
    .update(
      { _id: { $in: readingIds.map(id => new ObjectId(id)) }, user_id: context.user._id },
      { $pull: { journal_entries: { _id: new ObjectId(journalId) } } },
      { multi: true },
    )));

  callback(null, {
    statusCode: 200,
    // body: {},
  });
};
module.exports.handler = wrapper(handler);
