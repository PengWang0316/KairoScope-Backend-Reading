require('../helpers/initailEnvsForUnitTest');
const { ObjectId } = require('mongodb');
const { handler } = require('../../functions/fetch-journal');

const journal = { _id: '5bf39beefb84fc0fa3e2632e' };
const readingResult = [{ _id: 'readingId', reading_name: 'readingName', journal_entries: [journal] }];
const mockToArray = jest.fn().mockImplementation(cb => cb(null, readingResult));
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/mongodb-helper', () => ({
  getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('fetch-journal', () => {
  test('Verified user calls', async () => {
    const event = { queryStringParameters: { journalId: '5bf39beefb84fc0fa3e2632e' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('@kevinwang0316/mongodb-helper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');
    const log = require('@kevinwang0316/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.getDB).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith(
      { 'journal_entries._id': new ObjectId(event.queryStringParameters.journalId), user_id: context.user._id },
      {
        projection: {
          _id: 1, reading_name: 1, user_id: 1, journal_entries: 1,
        },
      },
    );
    expect(mockToArray).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({ user_id: context.user._id, readingIds: { readingId: 'readingName' }, ...journal }) });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Verified user calls with an error', async () => {
    const event = { queryStringParameters: { journalId: '5bf39beefb84fc0fa3e2632e' } };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
    };
    const callback = jest.fn();
    const mongodb = require('@kevinwang0316/mongodb-helper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');
    const log = require('@kevinwang0316/log');
    mockToArray.mockImplementationOnce(cb => cb('Error Message', readingResult));

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodb.getDB).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith(
      { 'journal_entries._id': new ObjectId(event.queryStringParameters.journalId), user_id: context.user._id },
      {
        projection: {
          _id: 1, reading_name: 1, user_id: 1, journal_entries: 1,
        },
      },
    );
    expect(mockToArray).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 500 });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith('functionName has error message: Error Message');
  });
});
