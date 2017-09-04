/*jshint node: true*/
"use strict";

const path              = require('path');
const glob              = require('glob');
const DeployPlugin      = require('ember-cli-deploy-plugin');
const NPMInstallTask    = require('./tasks/npm-install');
const ZipTask           = require('./tasks/zip');
const UploadTask        = require('./tasks/upload');

const CONFIG_ENV_MAPPING = {
  FASTBOOT_S3_BUCKET: 'bucket',
  FASTBOOT_S3_KEY: 'key'
};

module.exports = DeployPlugin.extend({
  defaultConfig: {
    environment: 'production',
    outputPath: path.join('tmp', 'fastboot-dist'),
    zipPath: path.join('tmp', 'fastboot-dist.zip'),
    filesToExclude: '',
    skipNpmInstall: false
  },

  requiredConfig: ['environment', 'bucket'],

  configure() {
    var config = this.pluginConfig;

    // Copy environment variables to the config if defined.
    for (var key in CONFIG_ENV_MAPPING) {
      if (process.env[key]) {
        config[CONFIG_ENV_MAPPING[key]] = process.env[key];
      }
    }

    this._super.configure.apply(this, arguments);
  },

  willUpload(context) {
    let distDir = context.distDir;
    let zipPath = this.readConfig('zipPath');
    let filesToExclude = this.readConfig('filesToExclude');
    let skipNpmInstall = this.readConfig('skipNpmInstall');

    let npmInstallTask = new NPMInstallTask({
      log: this.log.bind(this),
      distDir: distDir
    });

    let zipTask = new ZipTask({
      context: context,
      log: this.log.bind(this),
      distDir: distDir,
      zipPath: zipPath,
      filesToExclude: filesToExclude
    });

    let promise = skipNpmInstall ? Promise.resolve('') : npmInstallTask.run();

    return promise
      .then(() => zipTask.run());
  },

  upload: function(context) {
    let region = this.readConfig('region');
    let bucket = this.readConfig('bucket');
    let key = this.readConfig('key');
    let accessKeyId = this.readConfig('accessKeyId');
    let secretAccessKey = this.readConfig('secretAccessKey');

    let uploadTask = new UploadTask({
      context: context,
      log: this.log.bind(this),
      hashedZipPath: context.hashedZipPath,
      region: region,
      bucket: bucket,
      key: key,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    });

    return uploadTask.run();
  },

  _logSuccess: function(outputPath) {
    var self = this;
    var files = glob.sync('**/**/*', { nonull: false, nodir: true, cwd: outputPath });

    if (files && files.length) {
      files.forEach(function(path) {
        self.log('✔  ' + path, { verbose: true });
      });
    }
    self.log('fastboot build ok', { verbose: true });

    return Promise.resolve(files);
  }
});

