/*jshint node: true*/

var fs           = require('fs-promise');
var path         = require('path');
var glob         = require('glob');
var RSVP         = require('rsvp');
var exec         = RSVP.denodeify(require('child_process').exec);
var AWS          = require('aws-sdk');
var Promise      = require('ember-cli/lib/ext/promise');
var DeployPlugin = require('ember-cli-deploy-plugin');
var md5Hash      = require('./md5-hash');

module.exports = DeployPlugin.extend({
  defaultConfig: {
    environment: 'production',
    outputPath: path.join('tmp', 'fastboot-dist'),
    zipPath: path.join('tmp', 'fastboot-dist.zip')
  },

  requiredConfig: ['bucket'],

  build: function() {
    var outputPath = this.readConfig('outputPath');
    var self = this;

    return this.buildFastBoot(outputPath)
      .then(function(files) {
        return {
          fastbootDistDir: outputPath,
          fastbootDistFiles: files || []
        };
      })
      .catch(function(error) {
        self.log('build failed', { color: 'red' });
        return Promise.reject(error);
      });
  },

  buildFastBoot: function(outputPath) {
    var buildEnv   = this.readConfig('environment');

    this.log('building fastboot app to `' + outputPath + '` using buildEnv `' + buildEnv + '`...', { verbose: true });

    process.env.EMBER_CLI_FASTBOOT = true;

    var Builder  = this.project.require('ember-cli/lib/models/builder');

    var builder = new Builder({
      ui: this.ui,
      outputPath: outputPath,
      environment: buildEnv,
      project: this.project
    });

    return builder.build()
      .finally(function() {
        return builder.cleanup();
      })
      .then(this._logSuccess.bind(this, outputPath))
      .finally(function() {
        process.env.EMBER_CLI_FASTBOOT = false;
      });
  },

  didBuild: function(context) {
    // Rewrite FastBoot index.html assets
    var browserAssetMap = JSON.parse(fs.readFileSync(context.distDir + '/assets/assetMap.json'));
    var fastBootAssetMap = JSON.parse(fs.readFileSync(context.fastbootDistDir + '/assets/assetMap.json'));
    var prepend = browserAssetMap.prepend;

    var indexHTML = fs.readFileSync(context.fastbootDistDir + '/index.html').toString();
    var newAssets = browserAssetMap.assets;
    var oldAssets = fastBootAssetMap.assets;

    for (var key in oldAssets) {
      var value = oldAssets[key];
      indexHTML = indexHTML.replace(prepend + value, prepend + newAssets[key]);
    }

    fs.writeFileSync(context.fastbootDistDir + '/index.html', indexHTML);
  },

  willUpload: function(context){
    var self = this;
    var zipPath = this.readConfig('zipPath');
    console.log('zipPath', zipPath);

    var includeInFastBootZip = [
      'fastboot-dist/index.html',
      path.join('fastboot-dist/assets', this.project.name() + '*.js'),
      path.join('fastboot-dist/assets', 'vendor*.js')
    ].join(' ');

    console.log('cwd', path.dirname(zipPath));
    return exec("zip -r " + path.basename(zipPath) + " " + includeInFastBootZip, {
      cwd: path.dirname(zipPath)
    })
      .then(function(){
        var zipBuf = fs.readFileSync(zipPath);
        var hash = md5Hash(zipBuf);
        var hashedZip = path.join(path.dirname(zipPath), 'fastboot-dist-' + hash + '.zip');

        context.fastbootHashedZip = hashedZip;

        return fs.rename(zipPath, hashedZip)
          .then(function() {
            self.log("created " + hashedZip, { verbose: true });
            return {
              hashedZip: hashedZip
            };
          });
      });
  },

  upload: function(context) {
    var bucket = this.readConfig('bucket');
    var file = context.hashedZip;

    this.log('uploading ' + file + ' to ' + bucket);

    var s3 = new AWS.S3({
      params: {
        Bucket: bucket
      }
    });

    return new Promise(function(resolve, reject) {
      var params = { Key: path.basename(file) };
      params.Body = fs.createReadStream(file);
      s3.upload(params, function(err, data) {
        if (err) {
          reject(err);
        }

        resolve(data);
      });
    });
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

