'use strict';

const verifyJWT = require('../libs/VerifyJWT');
const log = require('../libs/log');

const { jwtName } = process.env;

module.exports = {
  before: (handler, next) => {
    const user = handler.event.queryStringParameters && handler.event.queryStringParameters[jwtName]
      ? verifyJWT(handler.event.queryStringParameters[jwtName], handler.context.jwtSecret)
      : false;
    if (user) {
      handler.context.user = user;
      next();
    } else {
      log.info(`Invalid user tried to call ${handler.context.functionName}`);
      handler.callback(null, { body: 'Invalid User' });
    }
  },
};
