/* jshint node: true */
'use strict';

var ElasticBeanstalkDeployPlugin = require('./lib/elastic-beanstalk-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-elastic-beanstalk',

  createDeployPlugin: function(options) {
    return new ElasticBeanstalkDeployPlugin({
      name: options.name
    });
  }
};
