'use strict';
const globby = require('globby');
const fs = require('fs');
const xml2js = require('xml2js');

const STATUS_SKIP = 'SKIP';
const STATUS_FAIL = 'FAIL';
const STATUS_PASS = 'PASS';

const projectPath = normalizePath(process.env.WORKING_DIR || '');

const timestamp = new Date();

function normalizePath(strPath) {
  if (!strPath) {
    return strPath;
  }
  return strPath.replace(/\\/g, '/');
};

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

function buildTestResult(xmlResultObj, resultFilePath) {
  let name = xmlResultObj.$.name;
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
    status,
    name,
    attachments: [],
    exe_start_date: exe_start_date.toISOString(),
    exe_end_date: exe_end_date.toISOString(),
    automation_content: xmlResultObj.$.name,
    test_step_logs: xmlResultObj.testcase.map((item, order) => {
      return {
        order,
        status,
        description: item.$.name,
        expected_result: item.$.name
      }
    })
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
      name: `${xmlResultObj.$.name}.txt`,
      data: Buffer.from(failedMsg).toString("base64"),
      content_type: "text/plain"
    });
  }
  return testCase;
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
  xml2JSON,
  buildTestResult,
  scanDirWithPattern,
  normalizePath
}