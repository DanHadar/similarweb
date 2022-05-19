const SiteVisitsManager = require( './src/services/SiteVisitsManager' );
let { NEW_STATIC_FILES_PATH, FAILED_STATIC_FILES_PATH, FINISHED_STATIC_FILES_PATH, PORT, SERVICE_NAME } = require( './server.config' );
NEW_STATIC_FILES_PATH = `${ process.cwd() }/${ NEW_STATIC_FILES_PATH }`;
FAILED_STATIC_FILES_PATH = `${ process.cwd() }/${ FAILED_STATIC_FILES_PATH }`;
FINISHED_STATIC_FILES_PATH = `${ process.cwd() }/${ FINISHED_STATIC_FILES_PATH }`;
const app = require( './app' );
const fs = require( 'fs' );

async function main() {
    if ( !fs.existsSync( `${ NEW_STATIC_FILES_PATH }` ) ) fs.mkdirSync( `${ NEW_STATIC_FILES_PATH }` );
    if ( !fs.existsSync( `${ FAILED_STATIC_FILES_PATH }` ) ) fs.mkdirSync( `${ FAILED_STATIC_FILES_PATH }` );
    if ( !fs.existsSync( `${ FINISHED_STATIC_FILES_PATH }` ) ) fs.mkdirSync( `${ FINISHED_STATIC_FILES_PATH }` );
    await SiteVisitsManager.calculateSessions();
    // console.log( SiteVisitsManager.numUniqueVisitedSites( 'visitor_1' ) );
    // console.log( SiteVisitsManager.numSessions( 'www.s_1.com' ) );
    // console.log( SiteVisitsManager.medianSessionsLength( 'www.s_1.com' ) );
    app.listen( PORT, () => {
        console.log( `${ SERVICE_NAME } running and listen to port ${ PORT }` );
    } );
}

main();