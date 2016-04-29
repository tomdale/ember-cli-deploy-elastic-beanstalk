"use strict";

const fs = require('fs');
const chalk = require('chalk');
const S3 = require('../aws/s3');
const IAM = require('../aws/iam');
const ElasticBeanstalk = require('../aws/elastic-beanstalk');
const loadRegion = require('../aws/load-region');
const buildQuestions = require('../build-questions');

class ProvisionTask {
  constructor(options) {
    this.ui = options.ui;
  }

  run() {
    this.ui.writeLine(chalk.green('Provisioning AWS for FastBoot\n'));

    return this.initializeAWS()
      .then(() => this.askQuestions())
      .then(() => this.createApplicationIfNeeded())
      .then(() => this.createBucketIfNeeded())
      .then(() => this.createInstanceProfile())
      .then(() => this.createEnvironment())
      .then(() => this.writeConfiguration());
  }

  initializeAWS() {
    return loadRegion()
      .then(region => {
        this.s3 = new S3({ region: region });
        this.eb = new ElasticBeanstalk({ region: region });
        this.iam = new IAM({ region: region });
      });
  }

  askQuestions() {
    return this.gatherQuestionParameters()
      .then(params => {
        let questions = buildQuestions(params);
        return this.ui.prompt(questions);
      })
      .then(answers => {
        this.answers = answers;

        let prefix = answers.newApplicationName || answers.application.ApplicationName;
        prefix += `-${this.answers.environmentName}`;

        this.prefix = prefix.toLowerCase().replace(/ /g, '-');
      });
  }

  gatherQuestionParameters() {
    let apps = this.eb.describeApplications();
    let buckets = this.s3.listBuckets();

    return Promise.all([apps, buckets])
      .then(results => {
        return {
          apps: results[0],
          buckets: results[1]
        };
      });
  }

  createApplicationIfNeeded() {
    let answers = this.answers;

    if (answers.newApplicationName !== undefined) {
      this.ui.writeLine(chalk.blue(`Creating new Elastic Beanstalk application ${answers.newApplicationName}`));

      return this.eb.createApplication(answers.newApplicationName)
        .then(function(app) {
          answers.applicationName = app.ApplicationName;
        });
    }

    answers.applicationName = answers.application.ApplicationName;
  }

  createBucketIfNeeded() {
    let bucket = this.answers.bucket;

    this.ui.writeLine(chalk.blue(`Creating S3 bucket ${bucket}`));

    return this.s3.createBucket(bucket)
      .then(() => this.answers.bucket = bucket)
      .catch(err => {
        if (err.code === 'EntityAlreadyExists') {
          this.ui.writeLine(chalk.yellow(err.message));
        } else {
          throw err;
        }
      });
  }

  createInstanceProfile() {
    let prefix = this.prefix;
    let bucket = this.answers.bucket;

    return this.iam.createRole(prefix)
      .then(() => this.iam.createPolicy(prefix, bucket))
      .then(() => this.iam.createInstanceProfile(prefix));
  }

  createEnvironment() {
    let applicationName = this.answers.applicationName;

    this.ui.writeLine(chalk.blue('Creating Elastic Beanstalk application version'));

    return this.eb.createApplicationVersion(applicationName)
      .then(versionLabel => {
        this.ui.writeLine(chalk.blue(`Creating Elastic Beanstalk environment ${applicationName}`));

        let env = {
          FASTBOOT_S3_BUCKET: this.answers.bucket,
          FASTBOOT_S3_KEY: `${this.prefix}.json`
        };

        return this.eb.createEnvironment({
          applicationName: applicationName,
          environmentName: this.prefix,
          versionLabel: versionLabel,
          env: env
        })
        .then(data => {
          this.environmentID = data.EnvironmentId;
        });
      });
  }

  writeConfiguration() {
    let environmentName = this.answers.environmentName;
    let applicationName = this.answers.applicationName;
    let configPath = '.env.deploy.' + environmentName;

    let config = `FASTBOOT_S3_BUCKET=${this.answers.bucket}
FASTBOOT_S3_KEY=${this.prefix}.json`;

    fs.appendFileSync(configPath, config);

    this.ui.writeLine(chalk.green(`\nWrote configuration to ${configPath}:`));
    this.ui.write(chalk.white("\n" + config + "\n\n"));

    let command = chalk.blue(`ember deploy ${environmentName}`);
    this.ui.writeLine(chalk.green(`Run ${command} to deploy your app.`));
  }
}

module.exports = ProvisionTask;
