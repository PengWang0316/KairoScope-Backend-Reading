require('../helpers/initailEnvsForUnitTest');
const { ObjectId } = require('mongodb');
const { handler } = require('../../functions/fetch-journals');

const mockFind = jest.fn().mockReturnValue([{ journal_entries: [{ date: '03/16/1982' }, { date: '03/15/1982' }, { date: '03/17/1982' }] }]);
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseFindResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
// jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('fetch-journals', () => {
  test('Verified user calls without a user role', async () => {
    const event = { queryStringParameters: { readingId: '5a650627beabf5005c6cc6ff' } };
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
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ _id: new ObjectId(event.queryStringParameters.readingId), user_id: 'id' }, { projection: { journal_entries: 1 } });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: '[{"date":"03/17/1982"},{"date":"03/16/1982"},{"date":"03/15/1982"}]' });
  });

  test('Verified user calls with a super user role', async () => {
    const event = { queryStringParameters: { readingId: '5a650627beabf5005c6cc6ff' } };
    const context = {
      user: { _id: 'id', role: 1 },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodb.promiseFindResult).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith({ _id: new ObjectId(event.queryStringParameters.readingId) }, { projection: { journal_entries: 1 } });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: '[{"date":"03/17/1982"},{"date":"03/16/1982"},{"date":"03/15/1982"}]' });
  });
});
