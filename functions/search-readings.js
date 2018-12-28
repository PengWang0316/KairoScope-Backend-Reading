'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('../libs/MongoDBHelper');
const log = require('../libs/log');
const cloudwatch = require('../libs/cloudwatch');

const {
  readingCollectionName, hexagramCollectionName, ADMINISTRATOR_ROLE,
} = process.env;

// TODO should be refactored to use the front-end code match the result.
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

/** Working with method below to search readings based on the hexagram.
  * @param {object} query is an object that has reading's information that a user wants to search.
  * @param {function} callback is the function that will be executed after this function's call.
  * @param {object} results is the object that comes from hexagram search.
  * @return {null} No return.
*/
function searchForReadings(query, callback, results) {
  // assemble query object for MongoDB
  const queryArray = [];
  if (query.people) queryArray.push({ people: new RegExp(`.*${query.people}.*`) });
  if (query.userId) queryArray.push({ user_id: query.userId });
  if (results) {
    // if no img_arr was found, it means not such combination exsite. Give a empty array and quit.
    if (results.length === 0) {
      callback([]);
      return;
    }
    // if users used hexagrams' criterias, add img_arr for the searching criteria
    const hexagramQuery = [];
    results.forEach(element => {
      hexagramQuery.push({ hexagram_arr_1: element.img_arr });
      hexagramQuery.push({ hexagram_arr_2: element.img_arr });
    });
    queryArray.push({ $or: hexagramQuery });
  }
  // Start to deal with start date and end date
  if (query.endDate) {
    const endDate = new Date(query.endDate);
    endDate.setDate(endDate.getDate() + 1);
    queryArray.push({
      $and: [{ date: { $gte: new Date(query.startDate) } }, { date: { $lt: new Date(endDate) } }],
    });
  } else if (query.startDate) {
    /* If just one date is given, set the search criteria between that day's 00:00 to next day's 00:00 */
    const endDate = new Date(query.startDate);
    endDate.setDate(endDate.getDate() + 1);
    queryArray.push({
      $and: [{ date: { $gte: new Date(query.startDate) } }, { date: { $lt: endDate } }],
    });
  }
  if (queryArray.length === 0) queryArray.push({}); // if no one searching criteria was given, give a empty array to query, which will pull out all readings.

  getDB().collection(readingCollectionName)
    .find({ $and: queryArray }).sort({ date: -1 })
    .toArray((err, result) => {
      if (err) log.error('searchForReadings: ', err);
      if (result.length !== 0) findHexagramImages(result, callback);
      else callback(result);
    });
}

const handler = async (event, context, callback) => {
  const userRole = context.user.role || 3; // Give a default role
  const query = JSON.parse(event.queryStringParameters.searchCriterias);
  if (userRole * 1 !== ADMINISTRATOR_ROLE * 1) query.userId = context.user._id;

  const result = await cloudwatch.trackExecTime('MongoDBFindLatency', () => new Promise((resolve, reject) => {
    if (query.upperId !== 0 || query.lowerId !== 0
      || query.line13Id !== 0 || query.line25Id !== 0 || query.line46Id !== 0) {
      const queryObject = {};
      if (query.upperId !== 0) queryObject.upper_trigrams_id = new ObjectId(query.upperId);
      if (query.lowerId !== 0) queryObject.lower_trigrams_id = new ObjectId(query.lowerId);
      if (query.line13Id !== 0) queryObject.line_13_id = new ObjectId(query.line13Id);
      if (query.line25Id !== 0) queryObject.line_25_id = new ObjectId(query.line25Id);
      if (query.line46Id !== 0) queryObject.line_46_id = new ObjectId(query.line46Id);
      getDB().collection(hexagramCollectionName)
        .find(queryObject, { _id: 0, img_arr: 1 }).toArray((err, results) => {
          searchForReadings(query, returnResult => resolve(returnResult), results);
        });
    } else searchForReadings(query, returnResult => resolve(returnResult));
  }));

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(result),
  });
};

module.exports.handler = wrapper(handler);
