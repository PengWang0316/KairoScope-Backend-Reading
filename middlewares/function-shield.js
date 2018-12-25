'use strict';

const FuncShield = require('@puresec/function-shield');

module.exports = {
  before: (handler, next) => {
    FuncShield.configure({ // Use the Function Shield to block outbound, read, write, and create child process activities
      policy: {
        // 'block' mode => active blocking
        // 'alert' mode => log only
        // 'allow' mode => allowed, implicitly occurs if key does not exist
        outbound_connectivity: 'block',
        read_write_tmp: 'block',
        create_child_process: 'block',
        read_handler: 'block',
      },
      token: process.env.FUNCTION_SHIELD_TOKEN,
    });
    next();
  },
};
