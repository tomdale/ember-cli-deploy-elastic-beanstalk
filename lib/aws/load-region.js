"use strict";

const awscred = require('awscred');

module.exports = function() {
  return new Promise((resolve, reject) => {
    awscred.loadRegion((err, region) => {
      if (err) {
        reject(err);
      } else {
        resolve(region);
      }
    });
  });
};
