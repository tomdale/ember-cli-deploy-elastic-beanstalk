# ember-cli-deploy-elastic-beanstalk

An ember-cli-deploy plugin for deploying an Ember app to AWS Elastic Beanstalk running
FastBoot. Designed to be used in tandem with
[fastboot-aws][fastboot-aws].

[fastboot-aws]: https://github.com/tomdale/fastboot-aws

This plugin builds your application for FastBoot server-side rendering,
then uploads a zip of the build to Amazon S3.

Requires Node.js v4 or later.

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][plugin-documentation].

[plugin-documentation]: http://ember-cli.github.io/ember-cli-deploy/plugins

## Quick Start

To get up and running quickly, do the following:

- Configure your ember-cli-deploy pipeline for deploying to a CDN as
  usual. I recommend [ember-cli-deploy-s3][ember-cli-deploy-s3] with
  CloudFront.
- Install this plugin

[ember-cli-deploy-s3]: https://github.com/ember-cli-deploy/ember-cli-deploy-s3

```bash
$ ember install ember-cli-deploy-elastic-beanstalk
```

- Place the following configuration into `config/deploy.js`

```javascript
ENV['elastic-beanstalk'] = {
  bucket: '<your-s3-bucket>'
}
```

- Run the pipeline

```bash
$ ember deploy
```

## Installation

Run the following command in your terminal:

```bash
ember install ember-cli-deploy-elastic-beanstalk
```

## A Note on AWS Permissions

This plugin uses the official AWS SDK to perform uploads to S3. As
such, it will inherit any credentials you have saved by running `aws
configure` via the [AWS CLI][aws-cli]. For environments where it is not feasible
to use  `aws configure` (e.g. your CI environment like Travis), you can additionally
specify an `accessKeyId` and `secretAccessKey` as a configuration option for this
ember-cli-deploy plugin in the `deploy.js` file.


[aws-cli]: https://aws.amazon.com/cli/

For managing multiple credentials, I recommend using the
officially-supported profiles feature of AWS.

To create a new profile, make sure you've installed the AWS CLI and then
run:

```bash
aws configure --profile acme-corp
```

Enter your access key, secret key and other information requested. Once
done, this will create a profile called `acme-corp`.

To do a deploy with this saved credential profile, invoke the command
with the `AWS_PROFILE` environment variable set:

```bash
AWS_PROFILE=acme-corp ember deploy
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][plugin-documentation].

- `build`
- `didBuild`
- `willUpload`
- `upload`

## Configuration Options

For detailed information on how configuration of plugins works, please
refer to the [Plugin Documentation][plugin-documentation].

### bucket (`required`)

The AWS bucket that the FastBoot build will be uploaded to.

*Default:* `undefined`

### environment

The environment target for the FastBoot build. Can be one of
`"development"` or `"production"`.

*Default:* `production`

### outputPath

The path to the directory you'd like the FastBoot build to be built in to.

*Default:* `tmp/fastboot-dist`

### zipPath

The path to the zip file that should be created from the `outputPath`.

*Default:* `tmp/fastboot-dist.zip`


### accessKeyId

The AWS access key for the user that has the ability to upload to the `bucket`. If this is left undefined, 
the normal [AWS SDK credential resolution][5] will take place.

*Default:* `undefined`

### secretAccessKey

The AWS secret for the user that has the ability to upload to the `bucket`. This must be defined when `accessKeyId` is defined.

*Default:* `undefined`

### filesToExclude

Files that match this pattern will be excluded from the `zip`. For instance to
exclude files with `.map` extension pass: `'\*.map'`.

*Default:* `''`

### skipNpmInstall

Does not run `npm install` as part of the build procedure if set to `true`.

*Default:* `false`

## Thanks

A big thank you to [Luke Melia](https://github.com/lukemelia) for
helping me refactor my deploy script into an ember-cli-deploy plugin and
to the entire ember-cli-deploy core team for answering my many
questions.
