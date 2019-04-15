'use strict';

const { getDB } = require('@kevinwang0316/mongodb-helper');
const {
  createClient, getAsync, quit,
} = require('@kevinwang0316/redis-helper');
const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');


const { hexagramCollectionName, redisKeyHexagrams } = process.env;
// TODO should be refactored to use Redux match the result from the front-end
/* Working with method below to execute the callback function when all hexagram are fetched. */
const checkHexagramImageReadAndCallback = (checkNumber, targetNumber, callback, result) => {
  if (checkNumber === targetNumber) callback(result);
};

/** This method is using to find hexagram information for readings
  * @param {array} readings is an array that has reading objects.
  * @param {function} callback is a function will be transfered to anther function.
  * @return {null} No return.
 */
const findHexagramImagesFromDB = async (readings, callback) => {
  log.debug('Fall back to db read');
  let checkNumber = 0;
  const targetNumber = readings.length * 2;
  // Making a copy for the readings. So, the code below is safe when change reading in the forEach function.
  const copyReadings = [...readings];
  copyReadings.forEach(reading => {
    getDB().collection(hexagramCollectionName)
      .find({ img_arr: reading.hexagram_arr_1 }).next((err, imgInfo) => {
        reading.img1Info = imgInfo;
        checkNumber += 1;
        checkHexagramImageReadAndCallback(checkNumber, targetNumber, callback, copyReadings);
      });
    getDB().collection(hexagramCollectionName)
      .find({ img_arr: reading.hexagram_arr_2 }).next((err, imgInfo) => {
        reading.img2Info = imgInfo;
        checkNumber += 1;
        checkHexagramImageReadAndCallback(checkNumber, targetNumber, callback, copyReadings);
      });
  });
};

const findHexagramImages = async (redisHost, redisPort, redisPassword, readings, callback) => {
  try {
    log.debug('Initializing Redis client');
    createClient(redisHost, redisPort, redisPassword);
    let hexagrams = await cloudwatch.trackExecTime('RedisGetLatency', () => getAsync(redisKeyHexagrams));
    // Fall back to read from the db if the Redis does not have the info
    if (hexagrams === null) await findHexagramImagesFromDB(readings, callback);
    else {
      log.debug('Cache hit');
      hexagrams = JSON.parse(hexagrams);
      readings.forEach(reading => {
        reading.img1Info = hexagrams[reading.hexagram_arr_1];
        reading.img2Info = hexagrams[reading.hexagram_arr_2];
      });
      callback(readings);
    }
  } catch (err) { // Fall back to read from the db if the Redis throws error
    log.error(err);
    await findHexagramImagesFromDB(readings, callback);
  } finally {
    quit();
  }
};

module.exports = findHexagramImages;
