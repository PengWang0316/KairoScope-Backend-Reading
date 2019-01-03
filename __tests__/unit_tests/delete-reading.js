require('../helpers/initailEnvsForUnitTest');
const { ObjectId } = require('mongodb');
const { handler } = require('../../functions/delete-reading');

const mockDeleteOne = jest.fn();
const mockCollection = jest.fn().mockReturnValue({ deleteOne: mockDeleteOne });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseInsertResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
// jest.mock('../../libs/log', () => ({ error: jest.fn() }));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('delete-reading', () => {
  test('Verified user calls', async () => {
    const event = { queryStringParameters: { readingId: '5b5df01aa569a07d26359eea' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockDeleteOne).toHaveBeenCalledTimes(1);
    expect(mockDeleteOne).toHaveBeenLastCalledWith(
      { _id: new ObjectId(event.queryStringParameters.readingId), user_id: context.user._id },
    );
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200 });
  });
});
