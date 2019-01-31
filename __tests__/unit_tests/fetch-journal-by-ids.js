require('../helpers/initailEnvsForUnitTest');
const { ObjectId } = require('mongodb');
const { handler } = require('../../functions/fetch-journal-by-ids');

const journalId = '5bf39beefb84fc0fa3e2632e';
const readingId = '5a650627beabf5005c6cc6ff';
const journalA = { _id: new ObjectId(journalId) };
const mockThen = jest.fn().mockImplementation(cb => cb({ journal_entries: [journalA, { _id: new ObjectId('5bf39beefb84fc0fa3e2632a') }] }, null));
const mockFind = jest.fn().mockReturnValue({ then: mockThen });
const mockCollection = jest.fn().mockReturnValue({ findOne: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('fetch-journal-by-ids', () => {
  test('Verified user calls without error', async () => {
    const event = { queryStringParameters: { readingId, journalId } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');
    const log = require('@kevinwang0316/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.getDB).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ _id: new ObjectId(readingId), user_id: context.user._id }, { journal_entries: 1 });
    expect(mockThen).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify(journalA) });
    expect(log.error).not.toBeCalled();
  });

  test('Verified user calls with error', async () => {
    const event = { queryStringParameters: { readingId, journalId } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');
    const log = require('@kevinwang0316/log');
    mockThen.mockImplementationOnce(cb => cb({ journal_entries: [journalA] }, 'error'));

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodb.getDB).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith({ _id: new ObjectId(readingId), user_id: context.user._id }, { journal_entries: 1 });
    expect(mockThen).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 500 });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith('Error message from fetch-journal-by-ids: error');
  });
});
