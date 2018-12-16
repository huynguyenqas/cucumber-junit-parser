'use strict';
const gherkin = require('gherkin');
const globby = require('globby');
const fs = require('fs');
const xml2js = require('xml2js');

const STATUS_SKIP = 'SKIP';
const STATUS_FAIL = 'FAIL';
const STATUS_PASS = 'PASS';

const projectPath = normalizePath(process.env.WORKING_DIR || '');
let featurePath = normalizePath(process.env.FEATURE_PATH || projectPath);

if (featurePath && !featurePath.endsWith('/')) {
  featurePath = featurePath.concat('/');
}
const timestamp = new Date();
const featureScanPattern = process.env.FEATURE_SCAN_PATTERN || '**/*.feature';


function normalizePath(strPath) {
  if (!strPath) {
    return strPath;
  }
  return strPath.replace(/\\/g, '/');
};

function streamToArray(readableStream) {
  return new Promise((resolve, reject) => {
    const items = []
    readableStream.on('data', (item) => {
      items.push(item);
    })
    readableStream.on('error', reject)
    readableStream.on('end', () => resolve(items))
  })
};

function cloneTestSuite(testSuite) {
  return {
    info: testSuite.$,
    testCases: testSuite.testcase.map(i => {
      return {
        name: i.$.name,
        failure: i.failure
      }
    })
  }
}

function xml2JSON(xmlFilePath) {
  return new Promise((resolve, reject) => {
    let jsonString = fs.readFileSync(xmlFilePath, "utf-8");
    xml2js.parseString(jsonString, {
      preserveChildrenOrder: true,
      explicitArray: true,
      explicitChildren: true
    }, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

function buildTestResult(xmlResultObj, scenarioObj) {
  let name = `${scenarioObj.featureRelativePath}#${scenarioObj.name}`;
  let exe_start_date = new Date(timestamp);
  let exe_end_date = new Date(timestamp);
  exe_end_date.setSeconds(exe_start_date.getSeconds() + (parseInt(xmlResultObj.$.time || 0, 10)));

  let skippedCount = parseInt(xmlResultObj.$.skipped || 0, 10);
  let failureCount = parseInt(xmlResultObj.$.failures || 0, 10);
  let status = STATUS_PASS;
  if (failureCount) {
    status = STATUS_FAIL;
  } else if (skippedCount) {
    status = STATUS_SKIP;
  }
  let testCase = {
    status: status,
    name: name,
    attachments: [],
    exe_start_date: exe_start_date.toISOString(),
    exe_end_date: exe_end_date.toISOString(),
    automation_content: name,
    test_step_logs: [{
      order: 0,
      status: status,
      description: scenarioObj.name,
      expected_result: (scenarioObj.steps.map(i => {
        return `${i.keyword}${i.text}`
      })).join('\n')
    }]
  };

  if (failureCount) {
    let failures = xmlResultObj.testcase.filter(tc => {
      return tc.failure;
    })
    let failedMsg = (failures.map(f => {
      if (Array.isArray(f.failure)) {
        return f.failure.map(m => {
          return m._ || m.$.message || JSON.stringify(m, null, 2);
        })
      }
      //f.failure._ || f.failure.$.message || JSON.stringify(f.failure, null, 4);
    })).join('\n')
    testCase.attachments.push({
      name: `${scenarioObj.name}.txt`,
      data: Buffer.from(failedMsg).toString("base64"),
      content_type: "text/plain"
    });
  }
  return testCase;
}

/**
 * options: {
 *  projectPath: string,
 *  featurePath: string,
 *  featureScanPattern: string
 * }
 */
async function getScenarios(options) {
  let _options = options || {};
  let _projectPath = (_options.projectPath || projectPath);
  let _featurePath = (_options.featurePath || featurePath);

  let _featureScanPattern = _options.featureScanPattern || featureScanPattern;

  if (!_projectPath || !fs.lstatSync(_projectPath).isDirectory()) {
    throw 'process.env.WORKING_DIR - working directory: is not set or invalid value';
  }
  let featureFiles = scanDirWithPattern({
    path: _featurePath,
    pattern: _featureScanPattern
  });
  let messages = await streamToArray(gherkin.fromPaths(featureFiles, {
    includeSource: false,
    includeGherkinDocument: true,
    includePickles: false,
  }));
  let scenarios = [];
  messages.forEach(element => {
    let feature = element.gherkinDocument.feature;
    if (feature) {
      let uri = element.gherkinDocument.uri || '';
      let regex = new RegExp(projectPath, 'g');
      let relativeUri = uri.replace(regex, '');
      if (relativeUri && relativeUri.startsWith('/')) {
        relativeUri = relativeUri.substr(1);
      }
      // console.log(feature.description);
      feature.children.forEach(s => {
        if (s.scenario) {
          scenarios.push({
            name: s.scenario.name,
            location: s.scenario.location,
            featureRelativePath: relativeUri,
            steps: s.scenario.steps.map(step => {
              return {
                keyword: step.keyword,
                text: step.text
              }
            })

          });
          // console.log(s.scenario.name);
          // console.table(s.scenario.steps);
        }
      })
    }
  });
  return scenarios;
}

/**
* scanOptions: {
*   path: string,
*   pattern: string,
* }
*/
function scanDirWithPattern(scanOptions) {
  let scanPath = normalizePath(scanOptions.path);
  if (!fs.existsSync(scanPath)) {
    throw new Error(`Scan path not exists: ${scanPath}`);
  }
  if (fs.statSync(scanPath).isFile()) {
    return [scanPath];
  }
  if (fs.statSync(scanPath).isDirectory()) {
    if (scanPath[scanPath.length - 1] !== '/') {
      scanPath = scanPath.concat('/');
    }
    return globby.sync(`${scanPath}${scanOptions.pattern}`);
  }
  return [];
}

module.exports = {
  STATUS_FAIL,
  STATUS_PASS,
  STATUS_SKIP,
  normalizePath,
  xml2JSON,
  getScenarios,
  buildTestResult,
  scanDirWithPattern,
  cloneTestSuite
}