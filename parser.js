'use strict';
const utils = require('./utils');
const packageJson = require("./package.json");
const isDebug = (process.env.DEBUG || "false") === "true";

async function parse(pathToTestResult, options = {}) {
  console.log(` == Parser name: ${packageJson.name}, version ${packageJson.version} ==`);
  console.log(options);
  let customCallbacks = options.callbacks || {};
  console.log(`Path to test result: '${pathToTestResult}'`);
  let resultFiles = utils.scanDirWithPattern({
    path: pathToTestResult,
    pattern: process.env.RESULT_FILE_PATTERN || '**/*.xml'
  })
  let scenarios = await utils.getScenarios();
  if (!resultFiles.length || !scenarios.length) {
    throw new Error(`Error, number of result file: ${resultFiles.length}, number of scenarios: ${scenarios.length}`);
  }
  let resultMap = new Map();
  let order = 1;
  for (let rf of resultFiles) {
    // if (isDebug) {
    //   console.log(`Parsing ${rf} ...`);
    // }
    let parseFileResult = undefined;
    try {
      parseFileResult = await utils.xml2JSON(rf);
    } catch (error) {
      console.error(`Could not parse ${rf}`, error);
      continue;
    }

    let testSuite = parseFileResult.testsuite;
    let tsName = testSuite.$.name;
    let scenario = scenarios.find(s => {
      return s.name === tsName;
    })
    if (scenario) {
      let tcObj = customCallbacks.buildTestResult ? customCallbacks.buildTestResult(utils.cloneTestSuite(testSuite), scenario) : utils.buildTestResult(testSuite, scenario);
      if (tcObj && !resultMap.has(tcObj.automation_content)) {
        tcObj.order = order++;
        resultMap.set(tcObj.automation_content, tcObj);
      }
    } else {
      console.error(`Could not find scenario name ${tsName}`);
    }
    if (isDebug) {
      console.log(`Finish parsing ${rf}`);
    }
  }
  return (Array.from(resultMap.values()));
}

module.exports = {
  parse
};

