require('../helpers/initailEnvsForUnitTest');
const { ObjectId } = require('mongodb');
const { handler } = require('../../functions/delete-journal');

const mockUpdate = jest.fn();
const mockCollection = jest.fn().mockReturnValue({ update: mockUpdate });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseInsertResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
// jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('delete-journal', () => {
  test('Verified user calls', async () => {
    const event = { body: '{ "readingIds": ["5b5df01aa569a07d26359eea", "5b5df01aa569a07d26359eeb"], "journalId": "5b5df01aa569a07d26359eee" }' };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(
      { _id: { $in: JSON.parse(event.body).readingIds.map(id => new ObjectId(id)) }, user_id: context.user._id },
      { $pull: { journal_entries: { _id: new ObjectId('5b5df01aa569a07d26359eee') } } },
      { multi: true },
    );
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200 });
  });
});
