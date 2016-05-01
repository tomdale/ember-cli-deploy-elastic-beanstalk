"use strict";

const AWS = require('aws-sdk');

class S3 {
  constructor(options) {
    options = options || {};

    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      region: options.region
    });
  }

  listBuckets() {
    return this.s3.listBuckets().promise()
      .then(data => {
        return data.Buckets.map(b => b.Name);
      });
  }

  createBucket(bucketName) {
    let params = {
      Bucket: bucketName
    };

    return this.s3.createBucket(params).promise();
  }

  upload(bucket, key, file) {
    let params = {
      Bucket: bucket,
      Key: key,
      Body: file
    };

    return new Promise((resolve, reject) => {
      this.s3.upload(params, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}

module.exports = S3;
