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
### 1. On agent creation UI, select Universal Agent type
### 2. Specify cucumber project path
### 3. Specify cucumber result path
### 4. Under Result parser: select this parser name: cucumber-junit-parser
### 5. Select Executor name is node
### 6. Copy and paste content of [code-snippet.js](./code-snippet.js) to Execute Command editor  
### 7. Save the agent 
