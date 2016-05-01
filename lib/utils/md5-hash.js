"use strict";

const digestStream = require('digest-stream');

module.exports = function md5Hash(stream) {
  return new Promise((resolve, reject) => {
    let dstream = digestStream('md5', 'hex', function(digest) {
      resolve(digest);
    });

    dstream.on('error', reject);

    stream.pipe(dstream);
    // Force the pipe to start flowing since we never attach a consumer
    // to the dstream.
    dstream.resume();
  });
};
