# SessionCalculator
## Description
Session calculator is a REST api that was made to expose data about visitors sessions and site visits.

The application loads csv files to fill varibles in the application cache with visitors sessions data. for example the total number of unique sites that the user visits, sessions count of a specific site url (etc..)

## Solution
The application is a microservice.

The application has the folders below:
* [static](./src/static) (includes the files folders)
    * new - includes new files to load 
    * failed - includes files that failed in the load process
    * finished - includes files that finished the load process successfully 

    *The folders will be created when the application starts running if does not exist*

When the application starts running, it loads new csv files, create sessions, save it as varibles in the application cache and move the file to the relevant folder.
The application exposes a REST Api with 4 [endpoints](src/controllers/api.js):
- /calcSessions - mainly for testing, but its also exposed to users who want to load new files
- /numSessions/:siteUrl - an endpoint that recive site url as an url parameter and return string that include the total amount of site sessions
- /medianSessionsLength/:siteUrl - an endpoint that recive site url as an url parameter and return string that inclde the median of the total site session length
- /numUniqueVisitedSites/:visitorId - an endpoint that recive visitor id as an url parameter and return string that include the amount of the unique sites that the specific user visited

### Application structure
 * [src](./src)
   * [controllers](./src/controllers)
        * [api.js](./src/controllers/api.js)
        * [api.test.js](./src/controllers/api.test.js)
   * [DAL](./src/DAL)
        * [SessionsDAL.js](./src/DAL/SessionsDAL.js)
   * [services](./src/services) (aka BL)
        * [SiteVisitsManager.js](./src/services/SiteVisitsManager.js)
   * [static](./src/static) (for static files)
        * [failed](./src/static/failed) (will create on start up if not exists)
        * [finished](./src/static/finished) (will create on start up if not exists)
        * [new](./src/static/new) (will create on start up if not exists)
   * [utils](./src/utils)
        * [constants.js](./src/utils/constants.js)
        * [functions.js](./src/utils/functions.js)
 * [.gitignore](./.gitignore)
 * [app.js](./app.js)
 * [files.test.js](./files.test.js)
 * [package.json](./package.json)
 * [README.md](./README.md)
 * [server.config.js](./server.config.js)
 * [server.js](./server.js)

### Technologies
The project is created based on [NodeJS](https://nodejs.org/en/) language.

### Dependecies
#### Prod
* [express](https://expressjs.com/) (framework to expose nodejs as a server)
* [csv-parse](https://www.npmjs.com/package/csv-parser) (to read csv files)

#### Dev
* [jest](https://jestjs.io/) (for testing javascript)
* [supertest](https://www.npmjs.com/package/supertest) (for testing express)

## Installation & Set up
1. Install NodeJS (NodeJS v8.16.0 or higher) - [download](https://nodejs.org/en/download/)
2. Copy the project to a local folder (by git clone or manual copy)
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
Currently, the application stores the data on the application cache memory.
In order to scale it up, there is one change that sholud be made: store the data in a third party cache application like Redis or in a database like MongoDB and change fillTempDataFromDB & commitDataToDB functions from [SessionsDAL.js](./src/DAL/SessionsDAL.js) file to get & save data from/to the new third party application.

## Space & time complexity
### Time complexity
* calculateSessions function (including readCsvRows & fillSessionData functions) - minimum O(nlogn) / maximum O(n^2) / avg O(nlogn)
* numSessions function - O(1)
* medianSessionsLength function - minimum O(nlogn) / maximum O(n^2) / avg O(nlogn)
* numUniqueVisitedSites function - O(1)

### Space complexity
#### [SessionDAL](./src/DAL/SessionsDAL.js) file
* visitorSessionsTemp - O(n^2)
* siteVisitsTemp - O(n^2)

#### [SiteVisitsManager](./src/services/SiteVisitsManager.js) file
* calculateSessions/files - O(n)
* medianSessionsLength/sessionLengthObj - O(n)
* medianSessionsLength/sortedKeysArr - O(logn)
* numUniqueVisitedSites/uniqueSitesObj - O(n)

## Testing
There are two test files in the project:
- [api.test.js](./src/controllers/api.test.js): wich tests the api endpoint. first of all, its testing the calcSessions endpoint to fill the application cache varibles with sessions data. then it tests each endpoint (except calcSessions) with three type of tests:
    1. Sending a request with url parameter - expecting to get data successfully
    2. Sending a request without url parameter - expecting to get 404 error code
    3. Sending a request with url parameter that not exists in sessions data - expecting to get data successfully with value 0
- [files.test.js](./files.test.js): wich tests the file loader funtion (calculateSessions) by a few test scenarios:
    1. Writing text file to the 'new' folder in the static files path - expecting that the function will move the file to 'failed' folder in the static files path
    2. Writing empty csv file to the 'new' folder - expecting that the function will move the file to 'finished' folder in the static files path
    3. Writing broken csv file (empty visitorId or site or page view timestamp) - expecting that the function will write a warning about the broken row and then continue to the next row
    4. Writing broken csv file (short page view timestamp) - expecting that the function will write a warning about the broken row and then continue to the ext row


run the following command for testing the application:
```bash
$ npm test
```
