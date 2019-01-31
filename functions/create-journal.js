'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { promiseInsertResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');
const log = require('@kevinwang0316/log');

const { readingCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { journal } = JSON.parse(event.body);
  journal.user_id = context.user._id;
  journal.date = new Date(journal.date);
  journal._id = new ObjectId();
  const readingObjectIdArray = [];
  Object.keys(journal.readings).forEach(element => {
    readingObjectIdArray.push(new ObjectId(element));
  });
  journal.pingPongStates = journal.readings; // Changing the name to poingPongStates
  delete journal.readings;
  try {
    await cloudwatch.trackExecTime('MongoDbUpdateLatancy', () => promiseInsertResult(db => db
      .collection(readingCollectionName)
      .update(
        { _id: { $in: readingObjectIdArray }, user_id: context.user._id },
        { $push: { journal_entries: journal } },
        { multi: true },
      )));
    callback(null, {
      statusCode: 200,
    });
  } catch (error) {
    log.error(`${context.functionName} function has error message: ${error}`);
    callback(null, { statusCode: 500 });
  }
};
module.exports.handler = wrapper(handler);
