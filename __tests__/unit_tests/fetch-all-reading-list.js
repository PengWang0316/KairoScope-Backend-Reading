require('../helpers/initailEnvsForUnitTest');
const { handler } = require('../../functions/fetch-all-reading-list');

const mockSort = jest.fn().mockReturnValue({ result: 'result' });
const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
const mockFind = jest.fn().mockReturnValue({ skip: mockSkip });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('middy/middlewares', () => ({ ssm: jest.fn() }));
jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseFindResult: jest.fn().mockImplementation(callback => callback({
    collection: mockCollection,
  })),
}));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('../../libs/VerifyJWT', () => jest.fn().mockReturnValue(false));
jest.mock('../../libs/log', () => ({ info: jest.fn() }));

describe('fetch-all-reading-list', () => {
  test('No query parameters', async () => {
    const event = {};
    const context = {};
    const callback = jest.fn();
    const { info } = require('../../libs/log');
    const verifyJwt = require('../../libs/VerifyJWT');
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

    // expect(context.callbackWaitsForEmptyEventLoop).toBe(false);
    // expect(mongodb.initialConnects).toBeCalledTimes(1);
    // expect(mongodb.initialConnects).toHaveBeenLastCalledWith('dbUrl', 'dbName');
    expect(verifyJwt).not.toHaveBeenCalled();
    expect(cloudwatch.trackExecTime).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call fetch-all-reading-list');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('JWT verify failed', async () => {
    const event = { queryStringParameters: { jwt: 'jwt' } };
    const context = {
      jwtSecret: 'jwtSecret',
    };
    const callback = jest.fn();
    const { info } = require('../../libs/log');
    const verifyJwt = require('../../libs/VerifyJWT');
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

    expect(verifyJwt).toHaveBeenCalledTimes(1);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwt', 'jwtSecret');
    expect(cloudwatch.trackExecTime).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(2);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call fetch-all-reading-list');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('Verified user calls without pageNumber', async () => {
    const event = { queryStringParameters: { jwt: 'jwt', numberPerpage: 10 } };
    const context = {
      jwtSecret: 'jwtSecret',
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const verifyJwt = require('../../libs/VerifyJWT');
    verifyJwt.mockReturnValueOnce({ _id: 'id' });
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

    expect(verifyJwt).toHaveBeenCalledTimes(2);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwt', 'jwtSecret');
    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.promiseFindResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith('reading');
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ user_id: 'id' }, { reading_name: 1, date: 1 });
    expect(mockSkip).toHaveBeenCalledTimes(1);
    expect(mockSkip).toHaveBeenLastCalledWith(0);
    expect(mockLimit).toHaveBeenCalledTimes(1);
    expect(mockLimit).toHaveBeenLastCalledWith(10);
    expect(mockSort).toHaveBeenCalledTimes(1);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({ result: 'result' }) });
  });

  test('Verified user calls with pageNumber', async () => {
    const event = { queryStringParameters: { jwt: 'jwt', numberPerpage: 10, pageNumber: 2 } };
    const context = {
      jwtSecret: 'jwtSecret',
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const verifyJwt = require('../../libs/VerifyJWT');
    verifyJwt.mockReturnValueOnce({ _id: 'id' });
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

    expect(verifyJwt).toHaveBeenCalledTimes(3);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwt', 'jwtSecret');
    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodb.promiseFindResult).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith('reading');
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith({ user_id: 'id' }, { reading_name: 1, date: 1 });
    expect(mockSkip).toHaveBeenCalledTimes(2);
    expect(mockSkip).toHaveBeenLastCalledWith(20);
    expect(mockLimit).toHaveBeenCalledTimes(2);
    expect(mockLimit).toHaveBeenLastCalledWith(10);
    expect(mockSort).toHaveBeenCalledTimes(2);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({ result: 'result' }) });
  });
});
