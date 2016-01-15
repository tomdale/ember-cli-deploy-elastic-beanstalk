var chalk = require('chalk');
var fs = require('fs');
var path = require('path');
var Promise = require('rsvp').Promise;

var CloudFormation = require('../aws/cloud-formation');
var ElasticBeanstalk = require('../aws/elastic-beanstalk');

var CREATE_NEW_APP = 'Create a new application';

module.exports = {
  name: 'eb:provision',

  description: 'Provisions an Elastic Beanstalk environment for FastBoot',

  run: function() {
    this.cf = new CloudFormation();
    this.eb = new ElasticBeanstalk();

    this.ui.writeLine(chalk.green('Provisioning AWS for FastBoot\n'));

    return this.askQuestions()
      .then(this.createApplicationIfNeeded.bind(this))
      .then(this.createStack.bind(this))
      .then(this.waitForStack.bind(this))
      .then(this.writeConfiguration.bind(this));
  },

  askQuestions: function() {
    var ui = this.ui;
    var self = this;

    return this.eb.describeApplications()
      .then(function(apps) {
        var questions = buildQuestions(apps);
        return ui.prompt(questions);
      })
      .then(function(answers) {
        self.answers = answers;
      });
  },

  createApplicationIfNeeded: function() {
    var answers = this.answers;

    if (answers.newApplicationName !== undefined) {
      return this.createApplication(answers.newApplicationName)
        .then(function(appName) {
          answers.applicationName = appName;
        });
    }

    answers.applicationName = answers.application.ApplicationName;
  },

  createStack: function() {
    var template = loadTemplate();
    var applicationName = this.answers.applicationName;
    var environmentName = this.answers.environmentName;
    var stackName = (applicationName + '-' + environmentName).replace(/ /, '');

    template.Description = "Ember FastBoot - " + this.project.name() + " - " + environmentName;

    return this.cf.createStack({
      stackName: stackName,
      applicationName: applicationName,
      environmentName: environmentName,
      template: template
    });
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
  },

  writeConfiguration: function() {
    var environmentName = this.answers.environmentName;
    var applicationName = this.answers.applicationName;
    var configPath = '.env.deploy.' + environmentName;
    var outputs = this.outputs;

    var config =
      "FASTBOOT_EB_APPLICATION=" + applicationName + "\n" +
      "FASTBOOT_EB_ENVIRONMENT=" + outputs.EnvironmentID + "\n" +
      "FASTBOOT_EB_BUCKET=" + outputs.DeploymentBucket + "\n";

    fs.appendFileSync(configPath, config);

    this.ui.writeLine('Wrote configuration to ' + configPath + ':');
    this.ui.write("\n" + config + "\n");
    this.ui.writeLine(chalk.green('Run ' + chalk.blue('ember deploy ' + environmentName) + ' to deploy your app, then visit ' + chalk.blue(this.outputs.URL)));
  }
};

function buildQuestions(apps) {
  return [{
    name: 'application',
    message: 'Which Elastic Beanstalk application would you like to use?',
    type: 'rawlist',
    choices: function() {
      var choices = apps.map(function(app) {
        return {
          name: app.ApplicationName,
          value: app
        };
      });

      choices.push(CREATE_NEW_APP);

      return choices;
    }
  }, {
    name: 'newApplicationName',
    message: 'What is the name of the application?',
    type: 'input',
    when: function(answers) {
      return answers.application === CREATE_NEW_APP;
    }
  }, {
    name: 'environmentName',
    message: 'Which environment?',
    type: 'rawlist',
    choices: ['development', 'staging', 'production']
  }];
}

function loadTemplate() {
  var templatePath = path.join(__dirname, '../../assets/cloud-formation-template.json');
  return JSON.parse(fs.readFileSync(templatePath));
}

function extractOutputs(outputs, data) {
  data.Stacks[0].Outputs.forEach(function(output) {
    outputs[output.OutputKey] = output.OutputValue;
  });

  return outputs;
}
