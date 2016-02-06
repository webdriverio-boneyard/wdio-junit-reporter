WDIO JUnit Reporter
===================

> A WebdriverIO plugin. Report results in junit xml format.

![WDIO JUnit Reporter](http://webdriver.io/images/jenkins-final.png "Dot Reporter")

## Installation

The easiest way is to keep `wdio-junit-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-junit-reporter": "~0.0.1"
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
  // ...
};
```

----

For more information on WebdriverIO see the [homepage](http://webdriver.io).
