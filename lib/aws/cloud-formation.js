var AWS = require('aws-sdk');
var RSVP = require('rsvp');
var awscred = require('awscred');
var loadRegion = RSVP.denodeify(awscred.loadRegion.bind(awscred));

function CloudFormation() {
  this.cf = new AWS.CloudFormation({
    apiVersion: '2010-05-15',
    region: 'us-east-1'
  });
}

CloudFormation.prototype.createStack = function(options) {
  var params = {
    StackName: options.stackName,
    Capabilities: [
      'CAPABILITY_IAM',
    ],
    OnFailure: 'DELETE',
    Parameters: [
      {
        ParameterKey: 'FastBootApplication',
        ParameterValue: options.applicationName,
      }, {
        ParameterKey: 'FastBootEnvironmentName',
        ParameterValue: options.environmentName
      }

    ],
    TemplateBody: JSON.stringify(options.template)
  };

  return this.performAction('createStack', params)
    .then(function(data) {
      return data.StackId;
    });
};

CloudFormation.prototype.describeStack = function(stackID) {
  return this.performAction('describeStacks', {
    StackName: stackID
  });
};

CloudFormation.prototype.performAction = function(actionName, params) {
  var cf = this.cf;
  var action = RSVP.denodeify(cf[actionName].bind(cf));

  return this.loadRegion()
    .then(function() {
      return action(params);
    });
};

CloudFormation.prototype.loadRegion = function() {
  if (!this._regionPromise) {
    var cf = this.cf;
    this._regionPromise = loadRegion()
      .then(function(region) {
        cf.config.region = region;
      });
  }

  return this._regionPromise;
};

module.exports = CloudFormation;
