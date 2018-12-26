'use strict';

/*
 * A middleware to wrap some comman middlwares. So all function will have these middlewares automatically.
 */
const middy = require('middy');
const { cors, functionShield, ssm } = require('middy/middlewares');

const sampleLogging = require('./sample-logging');
// const functionShield = require('./function-shield');

module.exports = func => middy(func)
  .use(cors({
    origin: 'https://kairoscope.resonancepath.com',
    credentials: true,
  }))
  .use(ssm({ FUNCTION_SHIELD_TOKEN: '/kairoscope/dev/function_shield_token' }))
  .use(sampleLogging())
  .use(functionShield({
    policy: {
      outbound_connectivity: 'alert',
      read_write_tmp: 'block',
      create_child_process: 'block',
      read_handler: 'block',
    },
  }));
