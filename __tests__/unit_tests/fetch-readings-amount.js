require('../helpers/initailEnvsForUnitTest');
const { handler } = require('../../functions/fetch-readings-amount');

const mockCount = jest.fn().mockReturnValue({ result: 'result' });
const mockCollection = jest.fn().mockReturnValue({ countDocuments: mockCount });

jest.mock('middy/middlewares', () => ({ ssm: jest.fn() }));
jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  initialConnects: jest.fn().mockResolvedValue(),
  promiseReturnResult: jest.fn().mockImplementation(callback => callback({
    collection: mockCollection,
  })),
}));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('../../libs/VerifyJWT', () => jest.fn().mockReturnValue(false));
jest.mock('../../libs/log', () => ({ info: jest.fn() }));

describe('fetch-readings-amount', () => {
  test('No query parameters', async () => {
    const event = {};
    const context = {
      // callbackWaitsForEmptyEventLoop: true,
      dbUrl: 'dbUrl',
      dbName: 'dbName',
    };
    const callback = jest.fn();
    const { info } = require('../../libs/log');
    const mongodb = require('../../libs/MongoDBHelper');
    const verifyJwt = require('../../libs/VerifyJWT');
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

    // expect(context.callbackWaitsForEmptyEventLoop).toBe(false);
    // expect(mongodb.initialConnects).toBeCalledTimes(1);
    // expect(mongodb.initialConnects).toHaveBeenLastCalledWith('dbUrl', 'dbName');
    expect(verifyJwt).not.toHaveBeenCalled();
    expect(cloudwatch.trackExecTime).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call fetch-readings-amount');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('JWT verify failed', async () => {
    const event = { queryStringParameters: { jwt: 'jwt' } };
    const context = {
      // callbackWaitsForEmptyEventLoop: true,
      dbUrl: 'dbUrl',
      dbName: 'dbName',
      jwtSecret: 'jwtSecret',
    };
    const callback = jest.fn();
    const { info } = require('../../libs/log');
    const mongodb = require('../../libs/MongoDBHelper');
    const verifyJwt = require('../../libs/VerifyJWT');
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

    // expect(context.callbackWaitsForEmptyEventLoop).toBe(false);
    // expect(mongodb.initialConnects).toBeCalledTimes(2);
    // expect(mongodb.initialConnects).toHaveBeenLastCalledWith('dbUrl', 'dbName');
    expect(verifyJwt).toHaveBeenCalledTimes(1);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwt', 'jwtSecret');
    expect(cloudwatch.trackExecTime).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(2);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call fetch-readings-amount');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('Verified user calls', async () => {
    const event = { queryStringParameters: { jwt: 'jwt' } };
    const context = {
      // callbackWaitsForEmptyEventLoop: true,
      dbUrl: 'dbUrl',
      dbName: 'dbName',
      jwtSecret: 'jwtSecret',
    };
    const callback = jest.fn();
    const { info } = require('../../libs/log');
    const mongodb = require('../../libs/MongoDBHelper');
    const verifyJwt = require('../../libs/VerifyJWT');
    verifyJwt.mockReturnValueOnce({ _id: 'id' });
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

    // expect(context.callbackWaitsForEmptyEventLoop).toBe(false);
    // expect(mongodb.initialConnects).toBeCalledTimes(3);
    // expect(mongodb.initialConnects).toHaveBeenLastCalledWith('dbUrl', 'dbName');
    expect(verifyJwt).toHaveBeenCalledTimes(2);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwt', 'jwtSecret');
    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.promiseReturnResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith('reading');
    expect(mockCount).toHaveBeenCalledTimes(1);
    expect(mockCount).toHaveBeenLastCalledWith({ user_id: 'id' });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({ result: 'result' }) });
  });
});
