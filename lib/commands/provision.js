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

/*

  createBucket: function() {
    var bucket = this.answers.s3Bucket;
  },

  createApplication: function(appName) {
    var ui = this.ui;
    var eb = this.eb;

    ui.startProgress('Creating application ' + appName);

    return eb.createApplication(appName)
      .then(function(app) {
        ui.stopProgress();
        return app.ApplicationName;
      });
  },

  waitForStack: function(stackID) {
    var ui = this.ui;
    var answers = this.answers;
    var environmentName = answers.environmentName;
    var cf = this.cf;

    ui.writeLine(chalk.green('\nThe environment may take 5-10 minutes to be created. Please be patient.'));
    ui.writeLine(chalk.green('Configuration details will be saved once environment creation has completed.\n'));

    ui.startProgress('Waiting for ' + environmentName + ' environment to be created.');

    var outputs = this.outputs = {};

    return new Promise(function(resolve, reject) {
      var stopPolling = function() {
        ui.stopProgress();
        clearInterval(interval);
      };

      var interval = setInterval(function() {
        cf.describeStack(stackID)
          .then(function(data) {
            var status = data.Stacks[0].StackStatus;

            if (status === 'CREATE_COMPLETE') {
              stopPolling();
              extractOutputs(outputs, data);
              resolve(data);

              ui.writeLine(chalk.green('Environment created.'));
            } else if (status === 'CREATE_FAILED') {
              stopPolling();
              reject(data);

              ui.writeLine(chalk.red('Stack creation failed'));
            }
          })
          .catch(function(err) {
            stopPolling();
            reject(err);
          });
      }, 5000);
    });
  }
};
*/
