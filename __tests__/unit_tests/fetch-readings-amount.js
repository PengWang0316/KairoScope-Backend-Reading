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

describe('fetch-readings-amount', () => {
  test('Verified user calls', async () => {
    const event = { queryStringParameters: { jwt: 'jwt' } };
    const context = {
      dbUrl: 'dbUrl',
      dbName: 'dbName',
      jwtSecret: 'jwtSecret',
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

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
