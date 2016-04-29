"use strict";

const AWS = require('aws-sdk');

class ElasticBeanstalk {
  constructor(options) {
    this.eb = new AWS.ElasticBeanstalk({
      apiVersion: '2010-12-01',
      region: options.region
    });
  }

  describeApplications() {
    return this.eb.describeApplications().promise()
      .then(apps => (apps ? apps.Applications : []));
  }

  describeEnvironment(appName, envName) {
    return this.performAction('describeEnvironments', {
      ApplicationName: appName,
      EnvironmentNames: [envName]
    })
      .then(data => data.Environments[0]);
  }

  createApplication(appName) {
    let params = {
      ApplicationName: appName
    };

    return this.eb.createApplication(params).promise()
      .then(data => data.Application);
  }

  createEnvironment(options) {
    const appName = options.applicationName;
    const environmentName = options.environmentName;
    const versionLabel = options.versionLabel;

    let env = buildEBEnv(options.env);
    env.push({
      Namespace: "aws:autoscaling:launchconfiguration",
      OptionName: "IamInstanceProfile",
      Value: `${environmentName}-instance-profile`
    });

    return this.eb.createEnvironment({
      ApplicationName: appName,
      EnvironmentName: environmentName,
      VersionLabel: versionLabel,
      SolutionStackName: "64bit Amazon Linux 2016.03 v2.1.0 running Node.js",
      OptionSettings: env
    }).promise();
  }

  createApplicationVersion(appName) {
    const versionLabel = appName + Date.now();

    return this.eb.createApplicationVersion({
      ApplicationName: appName,
      VersionLabel: versionLabel,
      AutoCreateApplication: false,
      SourceBundle: {
        S3Bucket: 'fastboot-aws',
        S3Key: 'latest.zip'
      }
    }).promise()
    .then(() => versionLabel);
  }

  updateEnvironment(applicationName, environmentName, env) {
      const params = {
        ApplicationName: applicationName,
        EnvironmentName: environmentName,
        OptionSettings: buildEBEnv(env)
      };

      return this.performAction('updateEnvironment', params);
  }
}

function buildEBEnv(hash) {
  const env = [];

  for (const key in hash) {
    env.push({
      Namespace: 'aws:elasticbeanstalk:application:environment',
      OptionName: key,
      Value: hash[key]
    });
  }

  return env;
}

module.exports = ElasticBeanstalk;
