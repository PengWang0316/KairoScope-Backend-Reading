require('../helpers/initailEnvsForUnitTest');
const { handler } = require('../../functions/fetch-readings-by-name');

const mockSort = jest.fn().mockReturnValue({ result: 'result' });
const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
const mockFind = jest.fn().mockReturnValue({ limit: mockLimit });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('middy/middlewares', () => ({ ssm: jest.fn() }));
jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseFindResult: jest.fn().mockImplementation(callback => callback({
    collection: mockCollection,
  })),
}));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('fetch-readings-by-name', () => {
  test('Verified user calls', async () => {
    const event = { queryStringParameters: { keyWord: 'keyword' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.promiseFindResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith('reading');
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ user_id: 'id', reading_name: new RegExp(`.*${event.queryStringParameters.keyWord}.*`, 'i') }, { projection: { reading_name: 1, date: 1 } });
    expect(mockLimit).toHaveBeenCalledTimes(1);
    expect(mockLimit).toHaveBeenLastCalledWith(10);
    expect(mockSort).toHaveBeenCalledTimes(1);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({ result: 'result' }) });
  });
});
