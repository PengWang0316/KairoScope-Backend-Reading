require('../helpers/initailEnvsForUnitTest');
const { handler } = require('../../functions/fetch-readings-by-hexagram-id');

const mockToArray = jest.fn().mockImplementation(cb => cb(null, []));
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })),
}));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('../../functions/libs/find-hexagram-images', () => jest.fn().mockImplementation((result, cb) => cb([{}])));

describe('fetch-readings-by-hexagram-id', () => {
  test('Verified user calls without a user role', async () => {
    const event = { queryStringParameters: { imageArray: 'imageArray' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const findHexagramImages = require('../../functions/libs/find-hexagram-images');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.getDB).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ $or: [{ hexagram_arr_1: 'imageArray' }, { hexagram_arr_2: 'imageArray' }], user_id: 'id' });
    expect(findHexagramImages).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify([]) });
  });

  test('Verified user calls with a user role 1', async () => {
    const event = { queryStringParameters: { imageArray: 'imageArray' } };
    const context = {
      user: { _id: 'id', role: 1 },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const findHexagramImages = require('../../functions/libs/find-hexagram-images');
    mockToArray.mockImplementationOnce(cb => cb(null, [{}]));

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodb.getDB).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith({ $or: [{ hexagram_arr_1: 'imageArray' }, { hexagram_arr_2: 'imageArray' }] });
    expect(findHexagramImages).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify([{}]) });
  });
});
