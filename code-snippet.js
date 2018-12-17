const { execSync } = require("child_process");
// read built-in $TESTCASES_AC and build command to run scheduled scenarinos
// or read content of file path process.env.MAGIC_VARIABLES_FILE_PATH
let cucumberOptions = "--junit,--step-notifications ";
if ($TESTCASES_AC && 0 < $TESTCASES_AC.length) {
    cucumberOptions += "-n '" + $TESTCASES_AC.replace(/,/g, '|') + "'";
} 
// build command line
let command = `mvn -Dcucumber.options="${cucumberOptions}" clean test`;

console.log(`=== executing command ===`);
console.log(command)
execSync(command, {stdio: "inherit"});
console.log(`=== command completed ===`)
