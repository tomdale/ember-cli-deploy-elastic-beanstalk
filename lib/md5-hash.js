/*jshint node: true*/
var digestStream = require('digest-stream');
var RSVP = require('rsvp');

module.exports = function md5Hash(stream) {
  return new RSVP.Promise(function(resolve, reject) {
    var dstream = digestStream('md5', 'hex', function(digest) {
      resolve(digest);
    });

    dstream.on('error', reject);

    stream.pipe(dstream);
    // Force the pipe to start flowing since we never attach a consumer
    // to the dstream.
    dstream.resume();
  });
};
