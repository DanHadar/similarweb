# SessionCalculator
## Description
Session calculator is a REST api that made to expose data about visitor session and site visits.
The application load csv files to fulfille varibles with visitors session data like the total number of unique sites that the user visit or session count of a specific site url (etc..)

## Solution
A microservice that run on start up on the new files from 'new' folder in the static files path, load and fulfille all data to varibles in app cache.
expose a REST Api with 4 [endpoints](src/controllers/api.js):
- /calcSessions - mainly for testing but exposed for users who want to load new files as well
- /numSessions/:siteUrl - an endpoint that recive site url as an url parameter and return string that include the total amount of site sessions
- /medianSessionsLength/:siteUrl - an endpoint that recive site url as an url parameter and return string that inclde the median of the total site session length
- /numUniqueVisitedSites/:visitorId - an endpoint that recive visitor id as an url parameter and return string that include the amount of the unique sites that the specific user visited

### Technologies
This project built and base on [NodeJS](https://nodejs.org/en/) language.

### Dependecies
#### Prod
* [express](https://expressjs.com/) (framework to expose nodejs as a server)
* [csv-parse](https://www.npmjs.com/package/csv-parser) (to read csv files)

#### Dev
* [jest](https://jestjs.io/) (for testing javascript)
* [supertest](https://www.npmjs.com/package/supertest) (for testing express)

## Installation & Setting up
1. Install Node from - [download](https://nodejs.org/en/download/) (Node v8.16.0 or higher)
2. Clone project to a local folder (by git or manual copy)
3. run the following commands in your project folder (cmd)
    1. install packages
    ```bash
    $ npm install
    ```
    2. run the application
    ```bash
    $ node server.js
    ```
4. use third party application or browser to send a request i.e:
    ```bash
    GET http://localhost:3001/api/numUniqueVisitedSites/visitor_1 
    ```
    _before running the application make sure port 3001 is free or change the default application's port in server.config.js file_

## Scalling up
The application is storing the data in application cache varibles, for scalling up the only change is to store the data in third party cache application like Redis or in a database like MongoDB.
All the rest of the application code is scalling up ready.

## Space & time complexity
### Time complexity
* calculateSessions function (including readCsvRows & fillSessionData functions) - minimum O(nlogn) / maximum O(n^2) / avg O(nlogn)
* numSessions function - O(1)
* medianSessionsLength - minimum O(nlogn) / maximum O(n^2) / avg O(nlogn)
* numUniqueVisitedSites - O(1)

### Space complexity

## Testing
There are two test files in the project:
- api.test.js:
    wich testing the api endpoint, first of all, testing the calcSessions endpoint to fulfill the application cache varibles with sessions data, then tests each endpoint (except calcSessions) with three type of tests:
    1. Sending a request with url parameter - expect to get data successfully
    2. Sending a request without url parameter - expect to get 404 error code
    3. Sending a request with url parameter that not exists in sessions data - expect to get data successfully with value 0