const { execSync } = require("child_process");
// read built-in $TESTCASES_AC and build command to run scheduled scenarinos
// or read content of file path process.env.MAGIC_VARIABLES_FILE_PATH
let command = 'mvn clean test';
let cucumberOptions = '';
if ($TESTCASES_AC && 0 < $TESTCASES_AC.length) {
	cucumberOptions = $TESTCASES_AC.replace(/,/g, '|');
    // run scheduled scenarios by scenario name
    command=`mvn -Dcucumber.options="-n '${cucumberOptions}'" clean test`;
} 
console.log(`=== executing command ===`);

console.log(command)
execSync(command, {stdio: "inherit"});
console.log(`=== command completed ===`)
