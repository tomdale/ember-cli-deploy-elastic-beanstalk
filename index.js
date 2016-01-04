/* jshint node: true */
'use strict';

var ElasticBeanstalkDeployPlugin = require('./lib/elastic-beanstalk-deploy-plugin');
var ProvisionCommand = require('./lib/commands/provision');

module.exports = {
  name: 'ember-cli-deploy-elastic-beanstalk',

  includedCommands: function() {
    return { 'eb:provision': ProvisionCommand };
  },

  createDeployPlugin: function(options) {
    return new ElasticBeanstalkDeployPlugin({
      name: options.name
    });
  }
};
