require('../helpers/initailEnvsForUnitTest');
const { handler } = require('../../functions/fetch-readings');

const mockToArray = jest.fn().mockImplementation(cb => cb(null, []));
const mockSkip = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockLimit = jest.fn().mockReturnValue({ skip: mockSkip });
const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('../../functions/libs/find-hexagram-images', () => jest.fn().mockImplementation((result, cb) => cb([{}])));

describe('fetch-readings', () => {
  test('Verified user calls without a user role', async () => {
    const event = { queryStringParameters: { pageNumber: '1', numberPerpage: '10' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const findHexagramImages = require('../../functions/libs/find-hexagram-images');
    const { error } = require('@kevinwang0316/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.getDB).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ user_id: 'id' });
    expect(mockSort).toHaveBeenCalledTimes(1);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(mockLimit).toHaveBeenCalledTimes(1);
    expect(mockLimit).toHaveBeenLastCalledWith(10);
    expect(mockSkip).toHaveBeenCalledTimes(1);
    expect(mockSkip).toHaveBeenLastCalledWith(10);
    expect(mockToArray).toHaveBeenCalledTimes(1);
    expect(findHexagramImages).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify([]) });
  });

  test('Verified user calls with a user role 1', async () => {
    const event = { queryStringParameters: { pageNumber: '2', numberPerpage: '20' } };
    const context = {
      user: { _id: 'id', role: '1' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const findHexagramImages = require('../../functions/libs/find-hexagram-images');
    const { error } = require('@kevinwang0316/log');
    mockToArray.mockImplementationOnce(cb => cb(null, [{}]));

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodb.getDB).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith({});
    expect(mockSort).toHaveBeenCalledTimes(2);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(mockLimit).toHaveBeenCalledTimes(2);
    expect(mockLimit).toHaveBeenLastCalledWith(20);
    expect(mockSkip).toHaveBeenCalledTimes(2);
    expect(mockSkip).toHaveBeenLastCalledWith(40);
    expect(mockToArray).toHaveBeenCalledTimes(2);
    expect(findHexagramImages).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify([{}]) });
  });

  test('Verified user calls with a user role 1 has error', async () => {
    const event = { queryStringParameters: { pageNumber: '2', numberPerpage: '20' } };
    const context = {
      user: { _id: 'id', role: '1' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const findHexagramImages = require('../../functions/libs/find-hexagram-images');
    const { error } = require('@kevinwang0316/log');
    mockToArray.mockImplementationOnce(cb => cb('error message', [{}]));

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(3);
    expect(mongodb.getDB).toHaveBeenCalledTimes(3);
    expect(mockCollection).toHaveBeenCalledTimes(3);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(3);
    expect(mockFind).toHaveBeenLastCalledWith({});
    expect(mockSort).toHaveBeenCalledTimes(3);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(mockLimit).toHaveBeenCalledTimes(3);
    expect(mockLimit).toHaveBeenLastCalledWith(20);
    expect(mockSkip).toHaveBeenCalledTimes(3);
    expect(mockSkip).toHaveBeenLastCalledWith(40);
    expect(mockToArray).toHaveBeenCalledTimes(3);
    expect(findHexagramImages).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenLastCalledWith('Reading getRecentReadings something goes worry: error message');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({}) });
  });
});
