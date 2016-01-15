var AWS = require('aws-sdk');
var RSVP = require('rsvp');
var awscred = require('awscred');
var loadRegion = RSVP.denodeify(awscred.loadRegion.bind(awscred));

function ElasticBeanstalk() {
  this.eb = new AWS.ElasticBeanstalk({
    apiVersion: '2010-12-01',
    region: 'us-east-1'
  });
}

ElasticBeanstalk.prototype.describeApplications = function() {
  return this.performAction('describeApplications')
    .then(function(apps) {
      return apps ? apps.Applications : [];
    });
};

ElasticBeanstalk.prototype.describeEnvironment = function(appName, envName) {
  return this.performAction('describeEnvironments', {
    ApplicationName: appName,
    EnvironmentNames: [envName]
  })
    .then(function(data) {
      return data.Environments[0];
    });
};

ElasticBeanstalk.prototype.createApplication = function(appName) {
  return this.performAction('createApplication', {
      ApplicationName: appName
    })
    .then(function(data) {
      return data.Application;
    });
};

ElasticBeanstalk.prototype.createEnvironment = function(options) {
  var appName = options.applicationName;
  var environmentName = options.environmentName;
  var versionLabel = options.versionLabel;

  return this.performAction('createEnvironment', {
    ApplicationName: appName,
    EnvironmentName: environmentName,
    VersionLabel: versionLabel,
    SolutionStackName: "64bit Amazon Linux 2015.09 v2.0.5 running Node.js"
  });
};

ElasticBeanstalk.prototype.createApplicationVersion = function(appName) {
  var versionLabel = appName + Date.now();

  return this.performAction('createApplicationVersion', {
    ApplicationName: appName,
    VersionLabel: versionLabel,
    AutoCreateApplication: false,
    SourceBundle: {
      S3Bucket: 'ember-fastboot-elastic-beanstalk',
      S3Key: 'latest.zip'
    }
  })
  .then(function() {
    return versionLabel;
  });
};

ElasticBeanstalk.prototype.updateEnvironment = function(applicationName, environmentName, env) {
    var params = {
      ApplicationName: applicationName,
      EnvironmentName: environmentName,
      OptionSettings: buildEBEnv(env)
    };

    return this.performAction('updateEnvironment', params);
};

ElasticBeanstalk.prototype.loadRegion = function() {
  if (!this._regionPromise) {
    var eb = this.eb;
    this._regionPromise = loadRegion()
      .then(function(region) {
        eb.config.region = region;
      });
  }

  return this._regionPromise;
};

ElasticBeanstalk.prototype.performAction = function(actionName, params) {
  var eb = this.eb;
  var action = RSVP.denodeify(eb[actionName].bind(eb));

  return this.loadRegion()
    .then(function() {
      return action(params);
    });
};

function buildEBEnv(hash) {
  var env = [];

  for (var key in hash) {
    env.push({
      Namespace: 'aws:elasticbeanstalk:application:environment',
      OptionName: key,
      Value: hash[key]
    });
  }

  return env;
}

module.exports = ElasticBeanstalk;
