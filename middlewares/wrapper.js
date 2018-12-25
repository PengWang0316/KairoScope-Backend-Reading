'use strict';

/*
 * A middleware to wrap some comman middlwares. So all function will have these middlewares automatically.
 */
const middy = require('middy');

const sampleLogging = require('./sample-logging');
const functionShield = require('./function-shield');

module.exports = func => middy(func)
  .use(sampleLogging())
  .use(functionShield);
