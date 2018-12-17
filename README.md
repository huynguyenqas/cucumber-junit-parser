# cucumber-junit-parser
A sample how to parse jUnit result of cucumber project
# How to use
The project will be packaged and added as a custom parser on qTest Launch
# What it does
## Parse JUnit result for cucumber project
Each scenario will be a test case on qTest Manager
Test case name is scenaraio name
Scenario steps will be test steps of the test case
# How to make automation host execute only scheduled test runs
Create an Universal Agent
Specify cucumber project path
Specify cucumber result path
Under Result parser: select this parser - cucumber-junit-parser
Select Executor name is node
Copy and pase content of [./code-snippet.js]code-snippet.js to Execute Command editor  
