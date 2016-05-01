"use strict";

const path = require('path');
const spawn = require('child_process').spawn;
const fs = require('fs-promise');
const md5Hash = require('../utils/md5-hash');

/*
 * Zips the built `dist` directory for uploading to S3.
 */
class ZipTask {
  constructor(options) {
    this.context = options.context;
    this.log = options.log;
    this.distDir = options.distDir;
    this.zipPath = this.distDir.replace(/\/$/, '') + '.zip';
  }

  run() {
    return this.zip()
      .then(() => this.calculateMD5Hash())
      .then(hash => this.fingerprintZipWithMD5Hash(hash));
  }

  zip() {
    let distDir = this.distDir;
    let zipPath = this.zipPath;
    zipPath = path.resolve(zipPath);

    this.log('zipping ' + distDir + ' into ' + zipPath, { verbose: true });

    return new Promise((resolve, reject) => {
      let baseDir = path.basename(distDir);
      let containingDir = path.dirname(distDir);

      let zip = spawn('zip', ['-r', zipPath, baseDir], {
        cwd: containingDir
      });

      let log = data => this.log(data, { verbose: true });

      zip.stdout.on('data', log);
      zip.stderr.on('data', log);

      zip.on('close', code => {
        if (code === 0) resolve();
        else reject();
      });
    });
  }

  calculateMD5Hash() {
    let zipStream = fs.createReadStream(this.zipPath);
    return md5Hash(zipStream);
  }

  fingerprintZipWithMD5Hash(hash) {
    let distDir = this.distDir;
    let zipPath = this.zipPath;

    this.log("calculated zip hash " + hash, { verbose: true });

    let hashedZipPath = path.join(path.dirname(distDir), `${path.basename(distDir)}-${hash}.zip`);

    this.context.fastbootHashedZip = hashedZipPath;

    return fs.rename(zipPath, hashedZipPath)
      .then(() => {
        this.log("created " + hashedZipPath, { verbose: true });
        return {
          hashedZipPath: hashedZipPath
        };
      });
  }
}

module.exports = ZipTask;
