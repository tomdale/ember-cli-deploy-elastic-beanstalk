"use strict";

const CREATE_NEW_APP = 'Create a new application';
const CREATE_NEW_BUCKET = 'Create a new bucket';

module.exports = function buildQuestions(options) {
  let apps = options.apps;
  let buckets = options.buckets;

  return [{
    name: 'application',
    message: 'Which Elastic Beanstalk application would you like to use?',
    type: 'list',
    choices: function() {
      let choices = apps.map(function(app) {
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
    type: 'list',
    choices: ['development', 'staging', 'production']
  }, {
    name: 'bucket',
    message: 'Which S3 bucket should be used to store deployed versions?',
    type: 'input',
    default(answers) {
      let name = answers.newApplicationName || answers.application.ApplicationName;
      name = name.toLowerCase().replace(/ /g, '-');

      return `${name}-${answers.environmentName}`;
    },
    choices: function() {
      let choices = buckets.slice();

      choices.push(CREATE_NEW_BUCKET);

      return choices;
    }
  }, {
    name: 'newBucketName',
    message: 'What is the name of the new bucket?',
    type: 'input',
    when(answers) {
      return answers.bucket === CREATE_NEW_BUCKET;
    }
  }];
};

module.exports.CREATE_NEW_APP = CREATE_NEW_APP;
module.exports.CREATE_NEW_BUCKET = CREATE_NEW_BUCKET;
