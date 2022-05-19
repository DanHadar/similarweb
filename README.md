# SessionCalculator
## Description
Session calculator is a REST api that made to expose data about visitor session and site visits.
The program load csv files to fulfille varibles with visitors session data like the total number of unique sites that the user visit or session count of a specific site url (etc..)

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
i. Install Node from - [download](https://nodejs.org/en/download/) (Node v8.16.0 or higher)
ii. bla

Node v8.16.0 