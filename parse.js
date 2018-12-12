'use strict'
const gherkin = require('gherkin')

const featurePath = "E:/test/projects/cucumber-sample/resources/feature";
const options = {
  includeSource: true,
  includeGherkinDocument: true,
  includePickles: true,
}
const stream = gherkin.fromPaths([`${featurePath}/example.feature`]);

function streamToArray(readableStream) {
  return new Promise((resolve, reject) => {
    const items = []
    readableStream.on('data', items.push.bind(items))
    readableStream.on('error', reject)
    readableStream.on('end', () => resolve(items))
  })
}

(async() => {
  try {
    let messages = await streamToArray(stream);
    messages = messages;
  } catch (ex) {
    console.error(ex);
  }
  
})()