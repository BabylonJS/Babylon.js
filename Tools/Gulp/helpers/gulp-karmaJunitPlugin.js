var os = require('os')
var path = require('path')
var fs = require('fs')
var builder = require('xmlbuilder')

/* XML schemas supported by the reporter: 'xmlVersion' in karma.conf.js,
   'XMLconfigValue' as variable here.
   0 = "old", original XML format. For example, SonarQube versions prior to 6.2
   1 = first amended version. Compatible with SonarQube starting from 6.2
*/

// concatenate test suite(s) and test description by default
function defaultNameFormatter (browser, result) {
  return result.suite.join(' ') + ' ' + result.description
}

var JUnitReporter = function (baseReporterDecorator, config, logger, helper, formatError) {
  var log = logger.create('reporter.junit')
  var reporterConfig = config.junitReporter || {}
  // All reporterConfig.something are for reading flags from the Karma config file
  var pkgName = reporterConfig.suite || ''
  var outputDir = reporterConfig.outputDir
  var outputFile = reporterConfig.outputFile
  var useBrowserName = reporterConfig.useBrowserName
  var nameFormatter = reporterConfig.nameFormatter || defaultNameFormatter
  var classNameFormatter = reporterConfig.classNameFormatter
  var properties = reporterConfig.properties
  // The below two variables have to do with adding support for new SonarQube XML format
  var XMLconfigValue = reporterConfig.xmlVersion
  var NEWXML
  // We need one global variable for the tag <file> to be visible to functions
  var exposee
  var suites = []
  var pendingFileWritings = 0
  var fileWritingFinished = function () {}
  var allMessages = []

  // The NEWXML is just sugar, a flag. Remove it when there are more than 2
  // supported XML output formats.
  if (!XMLconfigValue) {
    XMLconfigValue = 0
    NEWXML = false
  } else {
    // Slack behavior: "If defined, assume to be 1" since we have only two formats now
    XMLconfigValue = 1
    NEWXML = true
  }

  if (outputDir == null) {
    outputDir = '.'
  }

  outputDir = helper.normalizeWinPath(path.resolve(config.basePath, outputDir)) + path.sep

  if (typeof useBrowserName === 'undefined') {
    useBrowserName = true
  }

  baseReporterDecorator(this)

  this.adapters = [
    function (msg) {
      allMessages.push(msg)
    }
  ]

  // Creates the outermost XML element: <unitTest>
  var initializeXmlForBrowser = function (browser) {
    var timestamp = (new Date()).toISOString().substr(0, 19)
    var suite
    if (NEWXML) {
      suite = suites[browser.id] = builder.create('unitTest')
      suite.att('version', '1')
      exposee = suite.ele('file', {'path': 'fixedString'})
    } else {
      suite = suites[browser.id] = builder.create('testsuite')
      suite.att('name', pkgName)
      .att('package', pkgName)
      .att('timestamp', timestamp)
      .att('id', 'MYTESTMYTEST')
      .att('hostname', os.hostname())
      var propertiesElement = suite.ele('properties')
      propertiesElement.ele('property', {name: 'browser.fullName', value: browser.fullName})

      // add additional properties passed in through the config
      for (var property in properties) {
        if (properties.hasOwnProperty(property)) {
          propertiesElement.ele('property', {name: property, value: properties[property]})
        }
      }
    }
  }

  // This function takes care of writing the XML into a file
  var writeXmlForBrowser = function (browser) {
    // Define the file name using rules
    var safeBrowserName = browser.name.replace(/ /g, '_')
    var newOutputFile
    if (outputFile && path.isAbsolute(outputFile)) {
      newOutputFile = outputFile
    } else if (outputFile != null) {
      var dir = useBrowserName ? path.join(outputDir, safeBrowserName)
                               : outputDir
      newOutputFile = path.join(dir, outputFile)
    } else if (useBrowserName) {
      newOutputFile = path.join(outputDir, 'TESTS-' + safeBrowserName + '.xml')
    } else {
      newOutputFile = path.join(outputDir, 'TESTS.xml')
    }

    var xmlToOutput = suites[browser.id]

    if (!xmlToOutput) {
      return // don't die if browser didn't start
    }

    pendingFileWritings++
    helper.mkdirIfNotExists(path.dirname(newOutputFile), function () {
      fs.writeFile(newOutputFile, xmlToOutput.end({pretty: true}), function (err) {
        if (err) {
          log.warn('Cannot write JUnit xml\n\t' + err.message)
        } else {
          log.debug('JUnit results written to "%s".', newOutputFile)
        }

        if (!--pendingFileWritings) {
          fileWritingFinished()
        }
      })
    })
  }

  // Return a 'safe' name for test. This will be the name="..." content in XML.
  var getClassName = function (browser, result) {
    var name = ''
    // configuration tells whether to use browser name at all
    if (useBrowserName) {
      name += browser.name
        .replace(/ /g, '_')
        .replace(/\./g, '_') + '.'
    }
    if (pkgName) {
      name += '.'
    }
    if (result.suite && result.suite.length > 0) {
      name += result.suite.join(' ')
    }
    return name
  }

  // "run_start" - a test run is beginning for all browsers
  this.onRunStart = function (browsers) {
    // TODO(vojta): remove once we don't care about Karma 0.10
    browsers.forEach(initializeXmlForBrowser)
  }

  // "browser_start" - a test run is beginning in _this_ browser
  this.onBrowserStart = function (browser) {
    initializeXmlForBrowser(browser)
  }

  // "browser_complete" - a test run has completed in _this_ browser
  // writes the XML to file and releases memory
  this.onBrowserComplete = function (browser) {
    var suite = suites[browser.id]
    var result = browser.lastResult
    if (!suite || !result) {
      return // don't die if browser didn't start
    }

    if (!NEWXML) {
      suite.att('tests', result.total ? result.total : 0)
      suite.att('errors', result.disconnected || result.error ? 1 : 0)
      suite.att('failures', result.failed ? result.failed : 0)
      suite.att('time', (result.netTime || 0) / 1000)
      suite.ele('system-out').dat(allMessages.join() + '\n')
      suite.ele('system-err')
    }

    writeXmlForBrowser(browser)

    // Release memory held by the test suite.
    suites[browser.id] = null
  }

  // "run_complete" - a test run has completed on all browsers
  this.onRunComplete = function () {
    allMessages.length = 0
  }

  // --------------------------------------------
  // | Producing XML for individual testCase    |
  // --------------------------------------------
  this.specSuccess = this.specSkipped = this.specFailure = function (browser, result) {
    var testsuite = suites[browser.id]
    var validMilliTime
    var spec

    if (!testsuite) {
      return
    }

    // New in the XSD schema: only name and duration. classname is obsoleted
    if (NEWXML) {
      if (!result.time || result.time === 0) {
        validMilliTime = 1
      } else {
        validMilliTime = result.time
      }
    }

    // create the tag for a new test case
    /*
    if (NEWXML) {
      spec = testsuite.ele('testCase', {
      name: nameFormatter(browser, result),
      duration: validMilliTime })
    }
    */

    if (NEWXML) {
      spec = exposee.ele('testCase', {
        name: nameFormatter(browser, result),
        duration: validMilliTime })
    } else {
      // old XML format. Code as-was
      spec = testsuite.ele('testcase', {
        name: nameFormatter(browser, result),
        time: ((result.time || 0) / 1000),
        classname: (typeof classNameFormatter === 'function' ? classNameFormatter : getClassName)(browser, result)
      })
    }

    if (result.skipped) {
      spec.ele('skipped')
    }

    if (!result.success) {
      result.log.forEach(function (err) {
        if (!NEWXML) {
          spec.ele('failure', {type: ''}, formatError(err))
        } else {
        // In new XML format, an obligatory 'message' attribute in failure
          spec.ele('failure', {message: formatError(err)})
        }
      })
    }
  }

  // wait for writing all the xml files, before exiting
  this.onExit = function (done) {
    if (pendingFileWritings) {
      fileWritingFinished = done
    } else {
      done()
    }
  }
}

JUnitReporter.$inject = ['baseReporterDecorator', 'config', 'logger', 'helper', 'formatError']

// PUBLISH DI MODULE
module.exports = {
  'reporter:junit': ['type', JUnitReporter]
}