'use strict';

const { initialConnects } = require('../libs/MongoDBHelper');

module.exports = {
  before: async (handler, next) => {
    await initialConnects(handler.context.dbUrl, handler.context.dbName);
    next();
  },
};
