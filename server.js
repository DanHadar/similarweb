const SiteVisitsManager = require( './src/services/SiteVisitsManager' );
const { fillSessionsData, sessionCountBySite, visitorUniqueSites, sessionLengthMedianBySite } = require( './src/DAL/SessionsDAL' );
const config = require( './server.config' );
const app = require( "express" )();
const port = config.PORT;
app.use( "/api", require( "./src/controllers/api" ) );
async function main() {
    await SiteVisitsManager.calculateSessions();
    console.log( SiteVisitsManager.numUniqueVisitedSites( 'visitor_1' ) );
    console.log( SiteVisitsManager.numSessions( 'www.s_1.com' ) );
    console.log( SiteVisitsManager.medianSessionsLength( 'www.s_1.com' ) );
    app.listen( port, () => {
        console.log( `${ config.SERVICE_NAME } running and listen to port ${ port }` );
    } );
}

main();