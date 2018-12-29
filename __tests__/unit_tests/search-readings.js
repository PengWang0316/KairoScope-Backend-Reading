require('../helpers/initailEnvsForUnitTest');
const { ObjectId } = require('mongodb');
const { handler } = require('../../functions/search-readings');

const mockToArray = jest.fn().mockImplementation(cb => cb(null, []));
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })),
}));
// jest.mock('../../libs/log', () => ({ error: jest.fn() }));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('../../functions/libs/search-for-readings', () => jest.fn().mockImplementation((query, cb, results) => cb({})));

describe('search-readings', () => {
  test.only('Verified user calls without a user role', async () => {
    const event = { queryStringParameters: { searchCriterias: '{"startDate":"","endDate":"","people":"","upperId":0,"lowerId":0,"line13Id":0,"line25Id":0,"line46Id":0}' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const searchForReadings = require('../../functions/libs/search-for-readings');
    // const { error } = require('../../libs/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.getDB).not.toHaveBeenCalled();
    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockFind).not.toHaveBeenCalled();
    expect(mockToArray).not.toHaveBeenCalled();
    expect(searchForReadings).toHaveBeenCalledTimes(1);
    // expect(error).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({}) });
  });

  test.only('Verified user calls without a user role upperId 1', async () => {
    const event = { queryStringParameters: { searchCriterias: '{"startDate":"","endDate":"","people":"","upperId":"595a8b17f271190858935906","lowerId":0,"line13Id":0,"line25Id":0,"line46Id":0}' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const searchForReadings = require('../../functions/libs/search-for-readings');
    // const { error } = require('../../libs/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodb.getDB).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ upper_trigrams_id: new ObjectId('595a8b17f271190858935906') }, { _id: 0, img_arr: 1 });
    expect(mockToArray).toHaveBeenCalledTimes(1);
    expect(searchForReadings).toHaveBeenCalledTimes(2);
    // expect(error).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({}) });
  });

  test.only('Verified user calls without a user role lowerId 1', async () => {
    const event = { queryStringParameters: { searchCriterias: '{"startDate":"","endDate":"","people":"","upperId":0,"lowerId":"595a8b17f271190858935906","line13Id":0,"line25Id":0,"line46Id":0}' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const searchForReadings = require('../../functions/libs/search-for-readings');
    // const { error } = require('../../libs/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(3);
    expect(mongodb.getDB).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith({ lower_trigrams_id: new ObjectId('595a8b17f271190858935906') }, { _id: 0, img_arr: 1 });
    expect(mockToArray).toHaveBeenCalledTimes(2);
    expect(searchForReadings).toHaveBeenCalledTimes(3);
    // expect(error).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({}) });
  });

  test.only('Verified user calls without a user role line13Id 1', async () => {
    const event = { queryStringParameters: { searchCriterias: '{"startDate":"","endDate":"","people":"","upperId":0,"lowerId":0,"line13Id":"595a8b17f271190858935906","line25Id":0,"line46Id":0}' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const searchForReadings = require('../../functions/libs/search-for-readings');
    // const { error } = require('../../libs/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(4);
    expect(mongodb.getDB).toHaveBeenCalledTimes(3);
    expect(mockCollection).toHaveBeenCalledTimes(3);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(3);
    expect(mockFind).toHaveBeenLastCalledWith({ line_13_id: new ObjectId('595a8b17f271190858935906') }, { _id: 0, img_arr: 1 });
    expect(mockToArray).toHaveBeenCalledTimes(3);
    expect(searchForReadings).toHaveBeenCalledTimes(4);
    // expect(error).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({}) });
  });

  test.only('Verified user calls without a user role line25Id 1', async () => {
    const event = { queryStringParameters: { searchCriterias: '{"startDate":"","endDate":"","people":"","upperId":0,"lowerId":0,"line13Id":0,"line25Id":"595a8b17f271190858935906","line46Id":0}' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const searchForReadings = require('../../functions/libs/search-for-readings');
    // const { error } = require('../../libs/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(5);
    expect(mongodb.getDB).toHaveBeenCalledTimes(4);
    expect(mockCollection).toHaveBeenCalledTimes(4);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(4);
    expect(mockFind).toHaveBeenLastCalledWith({ line_25_id: new ObjectId('595a8b17f271190858935906') }, { _id: 0, img_arr: 1 });
    expect(mockToArray).toHaveBeenCalledTimes(4);
    expect(searchForReadings).toHaveBeenCalledTimes(5);
    // expect(error).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({}) });
  });

  test.only('Verified user calls with a user role line46Id 1', async () => {
    const event = { queryStringParameters: { searchCriterias: '{"startDate":"","endDate":"","people":"","upperId":0,"lowerId":0,"line13Id":0,"line25Id":0,"line46Id":"595a8b17f271190858935906"}' } };
    const context = {
      user: { _id: 'id', role: 1 },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const searchForReadings = require('../../functions/libs/search-for-readings');
    // const { error } = require('../../libs/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(6);
    expect(mongodb.getDB).toHaveBeenCalledTimes(5);
    expect(mockCollection).toHaveBeenCalledTimes(5);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(5);
    expect(mockFind).toHaveBeenLastCalledWith({ line_46_id: new ObjectId('595a8b17f271190858935906') }, { _id: 0, img_arr: 1 });
    expect(mockToArray).toHaveBeenCalledTimes(5);
    expect(searchForReadings).toHaveBeenCalledTimes(6);
    // expect(error).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify({}) });
  });
});
