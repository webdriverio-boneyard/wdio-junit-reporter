WDIO JUnit Reporter
===================

[![Build Status](https://travis-ci.org/webdriverio/wdio-junit-reporter.svg?branch=master)](https://travis-ci.org/webdriverio/wdio-junit-reporter) [![Code Climate](https://codeclimate.com/github/webdriverio/wdio-junit-reporter/badges/gpa.svg)](https://codeclimate.com/github/webdriverio/wdio-junit-reporter) [![Test Coverage](https://codeclimate.com/github/webdriverio/wdio-junit-reporter/badges/coverage.svg)](https://codeclimate.com/github/webdriverio/wdio-junit-reporter/coverage) [![dependencies Status](https://david-dm.org/webdriverio/wdio-junit-reporter/status.svg)](https://david-dm.org/webdriverio/wdio-junit-reporter)

***

> A WebdriverIO plugin. Report results in junit xml format.

![WDIO JUnit Reporter](http://webdriver.io/images/jenkins-final.png "Dot Reporter")

## Installation

The easiest way is to keep `wdio-junit-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-junit-reporter": "~0.3.0"
  }
}
```

You can simple do it by:

```bash
npm install wdio-junit-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](http://webdriver.io/guide/getstarted/install.html).

## Configuration

Following code shows the default wdio test runner configuration. Just add `'junit'` as reporter
to the array. To get some output during the test you can run the [WDIO Dot Reporter](https://github.com/webdriverio/wdio-dot-reporter) and the WDIO JUnit Reporter at the same time:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: ['dot', 'junit'],
    reporterOptions: {
        junit: {
            outputDir: './',
            outputFileFormat: function(opts) { // optional
                return `results-${opts.cid}.${opts.capabilities}.xml`
            }
        }
    },
    // ...
};
```

The following options are supported:

### outputDir
Define a directory where your xml files should get stored.

Type: `String`<br>
Required

### outputFileFormat
Define the format of your xml files using an `opts` parameter that contains the runner id as well
as the capabilities of the runner.

Type: `Function`<br>
Default:

```js
outputFileFormat: function(opts) { // optional
    return `WDIO.xunit.${opts.capabilities}.${cid}.xml`
}
```

### suiteNameFormat

Gives the ability to provide custom regex for formatting test suite name (e.g. in output xml ).

Type: `Regex`,<br>
Default: `/[^a-z0-9]+/`

### packageName

You can break out packages by an additional level by setting `'packageName'`. For example, if you wanted to iterate over a test suite with different environment variable set:

Type: `String`<br>
Example:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: ['dot', 'junit'],
    reporterOptions: {
        junit: {
            outputDir: './',
            packageName: process.env.USER_ROLE // chrome.41 - administrator
        }
    }
    // ...
};
```

## Jenkins Setup

Last but not least you nead to tell your CI job (e.g. Jenkins) where it can find the xml file. To do that add a post-build action to your job that gets executed after the test has run and point Jenkins (or your desired CI system) to your XML test results:

![Point Jenkins to XML files](http://webdriver.io/images/jenkins-postjob.png "Point Jenkins to XML files")

If there is no such post-build step in your CI system there is probably a plugin for that somewhere on the internet.

## Development

All commands can be found in the package.json. The most important are:

Watch changes:

```sh
$ npm run watch
```

Run tests:

```sh
$ npm test

# run test with coverage report:
$ npm run test:cover
```

Build package:

```sh
$ npm build
```

----

For more information on WebdriverIO see the [homepage](http://webdriver.io).
