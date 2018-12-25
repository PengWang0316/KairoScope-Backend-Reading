'use strict';

const { ssm } = require('middy/middlewares');

const wrapper = require('../middlewares/wrapper');
const { promiseReturnResult } = require('../libs/MongoDBHelper');
const verifyJWT = require('../libs/VerifyJWT');
const log = require('../libs/log');
const cloudwatch = require('../libs/cloudwatch');

const { STAGE, collectionName, jwtName } = process.env;

const handler = async (event, context, callback) => {
  const user = verifyJWT(event.params[jwtName], context.jwtSecret);

  if (user) {
    const result = await cloudwatch.trackExecTime(() => promiseReturnResult(db => db
      .collection(collectionName)
      .count({ user_id: user._id })));
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result),
    });
  } else {
    log.info('Invalid user tried to call fetch-readings-amount');
    callback(null, 'Invalid User');
  }
};

module.exports.handler = wrapper(handler).use(ssm({
  cache: true,
  cacheExpiryInMillis: 3 * 60 * 1000,
  setToContext: true, // Save the parameters to context instead of env. The parameters will just live in memory for the security concern.
  names: {
    dbUrl: `/kairoscope/${STAGE}/db-host`,
    dbName: `/kairoscope/${STAGE}/db-name`,
    jwtSecret: `/kairoscope/${STAGE}/jwt-secret`,
  },
}));