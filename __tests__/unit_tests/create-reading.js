require('../helpers/initailEnvsForUnitTest');
// const sinon = require('sinon');

const { handler } = require('../../functions/create-reading');

const mockNext = jest.fn().mockImplementation(cb => cb(null, 'imgInfo'));
const mockFind = jest.fn().mockReturnValue({ next: mockNext });
const mockInsert = jest.fn().mockImplementation((reading, cb) => cb(null, { ops: [reading] }));
const mockCollection = jest.fn().mockReturnValue({ insert: mockInsert, find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })),
}));
jest.mock('../../libs/log', () => ({ error: jest.fn() }));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

// let clock;

describe('create-reading', () => {
  // beforeAll(() => {
  //   clock = sinon.useFakeTimers();
  // });

  // afterAll(() => clock.restore());

  test('Verified user calls without any error', async () => {
    const reading = { reading: { hexagram_arr_1: 'hexagramArr1', hexagram_arr_2: 'hexagramArr2', date: '2019-01-04T23:24:34.000Z' } };
    const event = { body: JSON.stringify(reading) };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const log = require('../../libs/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodb.getDB).toHaveBeenCalledTimes(3);
    expect(mockCollection).toHaveBeenCalledTimes(3);
    expect(mockCollection).toHaveBeenNthCalledWith(1, process.env.readingCollectionName);
    expect(mockCollection).toHaveBeenNthCalledWith(2, process.env.hexagramCollectionName);
    expect(mockCollection).toHaveBeenNthCalledWith(3, process.env.hexagramCollectionName);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenNthCalledWith(1, { img_arr: reading.reading.hexagram_arr_1 });
    expect(mockFind).toHaveBeenNthCalledWith(2, { img_arr: reading.reading.hexagram_arr_2 });
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 200,
      body: JSON.stringify({
        ...reading.reading, user_id: context.user._id, img1Info: 'imgInfo', img2Info: 'imgInfo',
      }),
    });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Verified user calls with insert error', async () => {
    const reading = { reading: { hexagram_arr_1: 'hexagramArr1', hexagram_arr_2: 'hexagramArr2', date: '2019-01-04T23:24:34.000Z' } };
    const event = { body: JSON.stringify(reading) };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const log = require('../../libs/log');
    mockInsert.mockImplementationOnce((readingA, cb) => cb('insert error', { ops: [readingA] }));

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(3);
    expect(mongodb.getDB).toHaveBeenCalledTimes(4);
    expect(mockCollection).toHaveBeenCalledTimes(4);
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 500,
    });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith('create-reading function has error message: insert error');
  });

  test('Verified user calls with the first next error', async () => {
    const reading = { reading: { hexagram_arr_1: 'hexagramArr1', hexagram_arr_2: 'hexagramArr2', date: '2019-01-04T23:24:34.000Z' } };
    const event = { body: JSON.stringify(reading) };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const log = require('../../libs/log');
    mockNext.mockImplementationOnce(cb => cb('the first next error', 'imgInfo'));

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(5);
    expect(mongodb.getDB).toHaveBeenCalledTimes(6);
    expect(mockCollection).toHaveBeenCalledTimes(6);
    expect(mockInsert).toHaveBeenCalledTimes(3);
    expect(mockFind).toHaveBeenCalledTimes(3);
    expect(mockNext).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 500,
    });
    expect(log.error).toHaveBeenCalledTimes(2);
    expect(log.error).toHaveBeenLastCalledWith('create-reading function has error message: the first next error');
  });

  test('Verified user calls with the second next error', async () => {
    const reading = { reading: { hexagram_arr_1: 'hexagramArr1', hexagram_arr_2: 'hexagramArr2', date: '2019-01-04T23:24:34.000Z' } };
    const event = { body: JSON.stringify(reading) };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const log = require('../../libs/log');
    mockNext.mockImplementationOnce(cb => cb(null, 'imgInfo'));
    mockNext.mockImplementationOnce(cb => cb('the second next error', 'imgInfo'));

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(7);
    expect(mongodb.getDB).toHaveBeenCalledTimes(9);
    expect(mockCollection).toHaveBeenCalledTimes(9);
    expect(mockInsert).toHaveBeenCalledTimes(4);
    expect(mockFind).toHaveBeenCalledTimes(5);
    expect(mockNext).toHaveBeenCalledTimes(5);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 500,
    });
    expect(log.error).toHaveBeenCalledTimes(3);
    expect(log.error).toHaveBeenLastCalledWith('create-reading function has error message: the second next error');
  });
});
