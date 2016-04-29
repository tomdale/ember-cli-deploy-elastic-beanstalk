"use strict";

const AWS = require('aws-sdk');
const chalk = require('chalk');

class IAM {
  constructor(options) {
    this.iam = new AWS.IAM({
      apiVersion: '2010-05-08',
      region: options.region
    });
  }

  createRole(prefix) {
    let assumeRolePolicyDocument = this.buildAssumeRolePolicyDocument();

    let params = {
      RoleName: `${prefix}-role`,
      AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument)
    };

    return this.iam.createRole(params).promise()
      .catch(entityExists);
  }

  buildAssumeRolePolicyDocument() {
    return {
      "Statement": [{
        "Effect": "Allow",
        "Principal": { "Service": "ec2.amazonaws.com" },
        "Action": ["sts:AssumeRole"]
      }]
    };
  }

  createPolicy(prefix, bucket) {
    let policyDocument = this.buildPolicyDocument(bucket);

    let params = {
      PolicyName: `${prefix}-role-policy`,
      PolicyDocument: JSON.stringify(policyDocument),
      RoleName: `${prefix}-role`
    };

    return this.iam.putRolePolicy(params).promise()
      .catch(entityExists);
  }

  buildPolicyDocument(bucket) {
    return {
      "Statement": [{
        "Effect": "Allow",
        "Action": [
          "s3:GetObject"
        ],
        "Resource": `arn:aws:s3:::${bucket}/*`
      }]
    };
  }

  createInstanceProfile(prefix) {
    let instanceProfileName = `${prefix}-instance-profile`;
    let params = {
      InstanceProfileName: instanceProfileName
    };

    return this.iam.createInstanceProfile(params).promise()
      .then(() => {
        let params = {
          InstanceProfileName: instanceProfileName,
          RoleName: `${prefix}-role`
        };

        return this.iam.addRoleToInstanceProfile(params).promise();
      })
      .catch(entityExists);
  }

}

function entityExists(data) {
  if (data.code === 'EntityAlreadyExists') {
    console.log(chalk.yellow(data.message));
  } else {
    throw data;
  }
}

module.exports = IAM;
