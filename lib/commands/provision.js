"use strict";

const ProvisionTask = require('../tasks/provision');

module.exports = {
  name: 'eb:provision',

  description: 'Provisions an Elastic Beanstalk environment for FastBoot',

  run: function() {
    let task = new ProvisionTask({
      ui: this.ui
    });

    return task.run();
  }
};
