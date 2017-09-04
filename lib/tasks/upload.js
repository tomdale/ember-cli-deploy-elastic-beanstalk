"use strict";

const fs = require('fs');
const path = require('path');
const S3 = require('../aws/s3');

class UploadTask {
  constructor(options) {
    this.context = options.context;
    this.log = options.log;
    this.bucket = options.bucket;
    this.key = options.key;
    this.hashedZipPath = options.hashedZipPath;
    this.hashedZipKey = path.basename(this.hashedZipPath);
    
    let s3Opts = { region: options.region };
    if (options.accessKeyId && options.secretAccessKey) {
      s3Opts.accessKeyId = options.accessKeyId;
      s3Opts.secretAccessKey = options.secretAccessKey;
    }
    this.s3 = new S3(s3Opts);
  }

  run() {
    return this.uploadHashedZip()
      .then(() => this.uploadVersionFile());
  }

  uploadHashedZip() {
    let hashedZipPath = this.hashedZipPath;
    let bucket = this.bucket;

    this.log('uploading ' + hashedZipPath + ' to ' + bucket, { verbose: true });

    let file = fs.createReadStream(hashedZipPath);

    return this.s3.upload(bucket, this.hashedZipKey, file);
  }

  uploadVersionFile() {
    let versionFile = {
      bucket: this.bucket,
      key: this.hashedZipKey
    };

    versionFile = JSON.stringify(versionFile);

    return this.s3.upload(this.bucket, this.key, versionFile);
  }
}

module.exports = UploadTask;
