import { ObjectId } from 'mongodb';
import mongodbHelper from '../../libs/MongoDBHelper';
import cloudwatch from '../../libs/cloudwatch';
import log from '../../libs/log';

require('../helpers/initailEnvsForUnitTest');

const { handler } = require('../../functions/create-journal');

const mockUpdate = jest.fn();
const mockCollection = jest.fn().mockReturnValue({ update: mockUpdate });

jest.mock('mongodb', () => ({ ObjectId: jest.fn() }));
jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseInsertResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('../../libs/log', () => ({ error: jest.fn() }));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('create-journal', () => {
  beforeEach(() => {
    mongodbHelper.promiseInsertResult.mockClear();
    cloudwatch.trackExecTime.mockClear();
    log.error.mockClear();
    ObjectId.mockClear();
  });

  test('Verified user calls without any error', async () => {
    const journal = { journal: { date: '01/11/2019', readings: { readingIdA: 'A', readingIdB: 'B' } } };
    const event = { body: JSON.stringify(journal) };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mockObjectId = new ObjectId();
    ObjectId.mockClear();

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodbHelper.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(
      { _id: { $in: [mockObjectId, mockObjectId] } },
      {
        $push: {
          journal_entries: {
            _id: mockObjectId, user_id: context.user._id, date: new Date(journal.journal.date), pingPongStates: journal.journal.readings,
          },
        },
      },
      { multi: true },
    );
    expect(ObjectId).toHaveBeenCalledTimes(3);
    expect(ObjectId).toHaveBeenNthCalledWith(1);
    expect(ObjectId).toHaveBeenNthCalledWith(2, 'readingIdA');
    expect(ObjectId).toHaveBeenNthCalledWith(3, 'readingIdB');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 200,
    });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Verified user calls with error', async () => {
    const journal = { journal: { date: '01/11/2019', readings: { readingIdA: 'A', readingIdB: 'B' } } };
    const event = { body: JSON.stringify(journal) };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
    };
    const callback = jest.fn();
    cloudwatch.trackExecTime.mockRejectedValueOnce('Error Message');
    // mongodbHelper.promiseInsertResult.mockRejectedValueOnce('Error Message');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 500,
    });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith(`${context.functionName} function has error message: Error Message`);
  });
});
