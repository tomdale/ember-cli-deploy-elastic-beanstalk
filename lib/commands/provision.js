var chalk = require('chalk');
var CloudFormation = require('../aws/cloud-formation');
var Promise = require('rsvp').Promise;
var fs = require('fs');
var path = require('path');

var CREATE_NEW_APP = 'Create a new application';

module.exports = {
  name: 'eb:provision',

  description: 'Provisions an Elastic Beanstalk application for FastBoot',

  run: function() {
    this.cf = new CloudFormation();

    this.ui.writeLine(chalk.green('Provisioning AWS for FastBoot\n'));

    return this.askQuestions()
      .then(this.createStack.bind(this))
      .then(this.waitForStack.bind(this));
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

  createStack: function() {
    var ui = this.ui;
    var self = this;

    var template = fs.readFileSync(path.join(__dirname, '..', 'assets', 'cloudformation-template.json'));

    return this.cf.createStack({
      name: '',
      template: template
    });
  },

  //createApplicationIfNeeded: function() {
    //var answers = this.answers;

    //if (answers.newApplicationName !== undefined) {
      //return this.createApplication(answers.newApplicationName)
        //.then(function(appName) {
          //answers.applicationName = appName;
        //});
    //}

    //answers.applicationName = answers.application.ApplicationName;
  //},

  //createApplication: function(appName) {
    //var ui = this.ui;
    //var eb = this.eb;

    //ui.startProgress('Creating application ' + appName);

    //return eb.createApplication(appName)
      //.then(function(app) {
        //ui.stopProgress();
        //return app.ApplicationName;
      //});
  //},

  //createApplicationVersion: function() {
    //var appName = this.answers.applicationName;
    //var ui = this.ui;
    //var self = this;

    //ui.startProgress('Deploying application version');

    //return this.eb.createApplicationVersion(appName)
      //.then(function(versionLabel) {
        //self.versionLabel = versionLabel;
        //ui.stopProgress();
      //});
  //},

  //createEnvironment: function() {
    //var ui = this.ui;
    //var answers = this.answers;
    //var environmentName = answers.environmentName;
    //var appName = answers.applicationName;
    //var versionLabel = this.versionLabel;

    //ui.startProgress('Creating environment ' + environmentName);

    //return this.eb.createEnvironment({
      //environmentName: environmentName,
      //applicationName: appName,
      //versionLabel: versionLabel
    //})
      //.then(function(data) {
        //ui.stopProgress();
        //return data;
      //});
  //},

  waitForStack: function() {
    var ui = this.ui;
    var answers = this.answers;
    var environmentName = answers.environmentName;
    var appName = answers.applicationName;
    var eb = this.eb;

    ui.writeLine(chalk.green('The environment may take 5-10 minutes to be created.'));
    ui.writeLine(chalk.green('You can safely Ctrl-C this process now. Otherwise, you will be notified here once your environment has finished starting up.'));
    ui.startProgress('Waiting for environment ' + environmentName + ' to be created.');

    return new Promise(function(resolve, reject) {
      var interval = setInterval(function() {
        eb.describeEnvironment(appName, environmentName)
          .then(function(data) {
            if (data.Status === 'Ready') {
              resolve(data);
              ui.stopProgress();
              ui.writeLine(chalk.green('Your application is now up and running at ' + chalk.blue(data.CNAME)));
              clearInterval(interval);
            }
          })
          .catch(function(err) {
            clearInterval(interval);
            reject(err);
          });
      }, 5000);
    });
  }
};

function buildQuestions(apps) {
  return [{
    name: 'application',
    message: 'Which application would you like to use?',
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
    message: 'What is the name of the environment?',
    type: 'input',
    //validate: function(value) {
      //return value.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{2,22}[a-zA-Z0-9]$/);
    //}
  }];
}
