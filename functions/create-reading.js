'use strict';

const wrapper = require('../middlewares/wrapper');
const { getDB } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');
const log = require('@kevinwang0316/log');

const { readingCollectionName, hexagramCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { reading } = JSON.parse(event.body);
  reading.user_id = context.user._id;
  reading.date = new Date(reading.date);
  try {
    const readingResult = await cloudwatch.trackExecTime('MongoDBCreateLatancy', () => new Promise((resolve, reject) => getDB()
      .collection(readingCollectionName)
      .insert(reading, (err, response) => {
        if (err) reject(err);
        resolve(response.ops[0]);
      })));
    // Fetching the hexagram information for the new reading
    const readingWithHexagram = await cloudwatch.trackExecTime('MongoDBFindLatancy', () => new Promise((resolve, reject) => {
      getDB().collection(hexagramCollectionName).find({ img_arr: reading.hexagram_arr_1 })
        .next((err1, img1Info) => {
          if (err1) reject(err1);
          else {
            readingResult.img1Info = img1Info;
            getDB().collection(hexagramCollectionName).find({ img_arr: reading.hexagram_arr_2 })
              .next((err2, img2Info) => {
                if (err2) reject(err2);
                readingResult.img2Info = img2Info;
                resolve(readingResult);
              });
          }
        });
    }));

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(readingWithHexagram),
    });
  } catch (error) {
    log.error(`create-reading function has error message: ${error}`);
    callback(null, { statusCode: 500 });
  }
};
module.exports.handler = wrapper(handler);
