/*jshint node: true*/
var crypto = require('crypto');

module.exports = function md5Hash(buf) {
  var md5 = crypto.createHash('md5');
  md5.update(buf);
  return md5.digest('hex');
};
