'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { promiseFindResult } = require('@kevinwang0316/mongodb-helper');
const cloudwatch = require('@kevinwang0316/cloudwatch');

const { readingCollectionName, ADMINISTRATOR_ROLE } = process.env;

const handler = async (event, context, callback) => {
  const { readingId } = event.queryStringParameters;
  const query = { _id: new ObjectId(readingId) };
  if (context.user.role * 1 !== ADMINISTRATOR_ROLE * 1) query.user_id = context.user._id;

  const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => promiseFindResult(db => db
    .collection(readingCollectionName)
    .find(query, { projection: { journal_entries: 1 } })));

  const journalEntries = result[0].journal_entries;
  journalEntries
    .sort((previous, next) => new Date(next.date).getTime() - new Date(previous.date).getTime());

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(journalEntries),
  });
};

module.exports.handler = wrapper(handler);
