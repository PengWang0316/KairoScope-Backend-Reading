'use strict';

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('../libs/MongoDBHelper');
const verifyJWT = require('../libs/VerifyJWT');
const log = require('../libs/log');
const cloudwatch = require('../libs/cloudwatch');

const { readingCollectionName, hexagramCollectionName, jwtName } = process.env;

// TODO This function should be refactored. Using Redux to store hexagram data and let the front-end code to match reading with them.
/* Working with method below to execute the callback function when all hexagram are fetched. */
const checkHexagramImageReadAndCallback = (checkNumber, targetNumber, callback, result) => {
  if (checkNumber === targetNumber) callback(result);
};

/** This method is using to find hexagram information for readings
  * @param {array} readings is an array that has reading objects.
  * @param {function} callback is a function will be transfered to anther function.
  * @return {null} No return.
 */
const findHexagramImages = (readings, callback) => {
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

const handler = async (event, context, callback) => {
  // context.callbackWaitsForEmptyEventLoop = false;
  // await initialConnects(context.dbUrl, context.dbName);
  const user = event.queryStringParameters
    ? verifyJWT(event.queryStringParameters[jwtName], context.jwtSecret)
    : false;

  if (user && user._id && user.role) {
    const { pageNumber, numberPerpage } = event.queryStringParameters;
    const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => new Promise((resolve, reject) => {
      getDB().collection(readingCollectionName)
        .find(user.role * 1 === process.env.ADMINISTRATOR_ROLE * 1 ? {} : { user_id: user._id })
        .sort({ date: -1 })
        .limit(numberPerpage * 1)
        .skip(pageNumber * numberPerpage)
        .toArray((err, readingResult) => {
          if (err) log.error('Reading getRecentReadings something goes worry: ', err);
          if (readingResult.length !== 0) findHexagramImages(readingResult, backResult => resolve(backResult));
          else resolve(readingResult);
        });
    }));
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result),
    });
  } else {
    log.info('Invalid user tried to call fetch-readings');
    callback(null, { body: 'Invalid User' });
  }
};

module.exports.handler = wrapper(handler);
