require('../../helpers/initailEnvsForUnitTest');

const {
  createClient, getAsync, quit,
} = require('@kevinwang0316/redis-helper');
const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { getDB } = require('@kevinwang0316/mongodb-helper');

const findHexagramImages = require('../../../functions/libs/find-hexagram-images');

const mockNext = jest.fn().mockImplementationOnce(cb => cb(null, 'imgInfo1')).mockImplementationOnce(cb => cb(null, 'imgInfo2'));
const mockFind = jest.fn().mockReturnValue({ next: mockNext });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('@kevinwang0316/mongodb-helper', () => ({ getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })) }));
jest.mock('@kevinwang0316/redis-helper', () => ({
  createClient: jest.fn(),
  getAsync: jest.fn(),
  quit: jest.fn(),
}));
jest.mock('@kevinwang0316/log', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));
jest.mock('@kevinwang0316/cloudwatch', () => ({
  trackExecTime: jest.fn().mockImplementation((name, fn) => fn()),
}));

describe('find-hexagram-images', () => {
  beforeEach(() => jest.clearAllMocks());

  test('findHexagramImages with Redis error', async () => {
    const mockErr = new Error('error message');
    createClient.mockImplementationOnce(() => {
      throw mockErr;
    });
    const mockCallback = jest.fn();
    const readings = [{ hexagram_arr_1: 'hexagramArr1', hexagram_arr_2: 'hexagramArr2' }];

    await findHexagramImages('host', 'port', 'password', readings, mockCallback);

    expect(log.debug).toHaveBeenCalledTimes(2);
    expect(log.debug).toHaveBeenNthCalledWith(1, 'Initializing Redis client');
    expect(log.debug).toHaveBeenNthCalledWith(2, 'Fall back to db read');
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenLastCalledWith('host', 'port', 'password');
    expect(getAsync).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith(mockErr);
    expect(quit).toHaveBeenCalledTimes(1);

    expect(getDB).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenNthCalledWith(1, { img_arr: 'hexagramArr1' });
    expect(mockFind).toHaveBeenNthCalledWith(2, { img_arr: 'hexagramArr2' });
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith([{
      hexagram_arr_1: 'hexagramArr1', hexagram_arr_2: 'hexagramArr2', img1Info: 'imgInfo1', img2Info: 'imgInfo2',
    }]);
  });
});
