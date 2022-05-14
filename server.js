const SessionsDAL = require( './src/DAL/SessionsDAL' );
const config = require( './server.config' );
const app = require( "express" )();
const port = config.PORT;
// app.use( "/api", require( "./src/controllers" ) );
async function main() {
    await new SessionsDAL().fillSessionsData();
    // console.log( new SessionsDAL().sessionsBySite( 'www.s_2.com' ) );
    for ( let i = 1; i <= 10; i++ ) {
        console.log( `sessionCountBySite: visitor_${ i }`, new SessionsDAL().sessionCountBySite( `www.s_${ i }.com` ) );
        console.log( `sessionLengthMedianBySite: visitor_${ i }`, new SessionsDAL().sessionLengthMedianBySite( `www.s_${ i }.com` ) );
        console.log( `visitorUniqueSites: visitor_${ i }`, new SessionsDAL().visitorUniqueSites( `visitor_${ i }` ) );
    } 
    app.listen( port, () => {
        console.log( `${ config.SERVICE_NAME } running and listen to port ${ port }` );
    } );

}

main();