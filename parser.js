'use strict';
const utils = require('./utils');
const packageJson = require("./package.json");

const projectPath = utils.normalizePath(process.env.WORKING_DIR || '');
let regex = new RegExp(projectPath, 'g');
async function parse(pathToTestResult, options = {}) {
  console.log(` == Parser name: ${packageJson.name}, version ${packageJson.version} ==`);
  console.log(`Path to test result: '${pathToTestResult}'`);
  let resultFiles = utils.scanDirWithPattern({
    path: pathToTestResult,
    pattern: process.env.RESULT_FILE_PATTERN || '**/*.xml'
  })
  if (!resultFiles.length) {
    throw new Error(`Error, number of result file: ${resultFiles.length}`);
  }
  let resultMap = new Map();
  let order = 1;
  for (let rf of resultFiles) {

    console.log(`Parsing ${rf} ...`);

    let parseFileResult = undefined;
    try {
      parseFileResult = await utils.xml2JSON(rf);
    } catch (error) {
      console.error(`Could not parse ${rf}`, error);
      continue;
    }

    let testSuite = parseFileResult.testsuite;
    if (testSuite) {
      let relativeUri = rf.replace(regex, '');
      if (relativeUri && relativeUri.startsWith('/')) {
        relativeUri = relativeUri.substr(1);
      }
      let tcObj = utils.buildTestResult(testSuite, relativeUri);
      if (tcObj && !resultMap.has(tcObj.automation_content)) {
        tcObj.order = order++;
        resultMap.set(tcObj.automation_content, tcObj);
      }
    } else {
      console.error(`Could not prase ${rf} `);
    }

    console.log(`Finish parsing ${rf}`);

  }
  return (Array.from(resultMap.values()));
}

module.exports = {
  parse
};

