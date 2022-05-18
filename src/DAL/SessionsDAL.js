const Session = require( '../classes/Session' );
const config = require( '../../server.config' );
const { tsDiffInMin, tsDiffInSec } = require( '../utils' );
const fs = require( 'fs' );
const { parse } = require( 'csv-parse' );

module.exports = {

    fillSessionsData: async function () {
        global.siteVisits || ( global.siteVisits = {} );// {site:{url:{count:1,sum:{1:sessionLength}}}} o(n^2)
        try {
            global.visitorSessions = undefined; //{id:{site:[Session]}}
            const newStaticFilesPath = `${ process.cwd() }${ config.NEW_STATIC_FILES_PATH }`;
            const finishedStaticFilesPath = `${ process.cwd() }${ config.FINISHED_STATIC_FILES_PATH }`;
            const failedStaticFilesPath = `${ process.cwd() }${ config.FAILED_STATIC_FILES_PATH }`; const files = fs.readdirSync( newStaticFilesPath );
            let sessionsIdCounter = 0;
            let funcName = 'diff files';
            console.log( 'start ' + funcName );
            console.time( funcName );
            for ( let fileIndex = 0; fileIndex < files.length; fileIndex++ ) { //loop over the new files
                const fileName = files[ fileIndex ];
                const csvJson = await readCsvAsJson( `${ newStaticFilesPath }/${ fileName }` ); //read csv as array
                global.visitorSessions = csvJson.reduce( function ( visitorSessions, row ) { //loop over rows in the csv
                    //--- initializing
                    [ visitorId, site, , ts ] = row;
                    ts = ts * 1000;
                    let currentVisitorSessions = visitorSessions[ visitorId ];
                    currentVisitorSessions || ( currentVisitorSessions = { sessions: {}, uniqueSites: {} } );
                    global.siteVisits[ site ] || ( global.siteVisits[ site ] = { sessionsCount: 0, sumSessionsLength: {} } );
                    currentVisitorSessions[ 'uniqueSites' ][ site ] || ( currentVisitorSessions[ 'uniqueSites' ][ site ] = true );
                    currentVisitorSessions[ 'sessions' ][ site ] || ( currentVisitorSessions[ 'sessions' ][ site ] = [] );

                    //--- fill first session of id+site
                    let currentSiteSessions = currentVisitorSessions[ 'sessions' ][ site ];
                    if ( !currentSiteSessions.length ) {
                        global.siteVisits[ site ][ 'sumSessionsLength' ][ ++sessionsIdCounter ] = 0;
                        global.siteVisits[ site ][ 'sessionsCount' ] += 1;
                        currentSiteSessions.push( { id: sessionsIdCounter, firstVisit: ts, lastVisit: ts } );
                    }
                    else {//loop over exists session of id+site
                        for ( i = currentSiteSessions.length - 1; i >= 0; i-- ) {
                            const currentSession = currentSiteSessions[ i ];
                            if ( ts < currentSession.firstVisit ) {
                                if ( tsDiffInMin( currentSession.firstVisit, ts ) <= config.SESSION_LIMIT ) {
                                    currentSession.firstVisit = ts;
                                    global.siteVisits[ site ][ 'sumSessionsLength' ][ currentSession[ 'id' ] ] = tsDiffInSec( currentSession.lastVisit, currentSession.firstVisit );
                                }
                                else if ( i === 0 ) {
                                    global.siteVisits[ site ][ 'sessionsCount' ] += 1;
                                    global.siteVisits[ site ][ 'sumSessionsLength' ][ ++sessionsIdCounter ] = 0;
                                    currentSiteSessions.splice( 0, 0, { id: sessionsIdCounter, firstVisit: ts, lastVisit: ts } );
                                }
                            }
                            else if ( tsDiffInMin( ts, currentSession.lastVisit ) > config.SESSION_LIMIT && ts !== currentSiteSessions[ i + 1 ]?.firstVisit ) {
                                global.siteVisits[ site ][ 'sessionsCount' ] += 1;
                                global.siteVisits[ site ][ 'sumSessionsLength' ][ ++sessionsIdCounter ] = 0;
                                currentSiteSessions.splice( i + 1, 0, { id: sessionsIdCounter, firstVisit: ts, lastVisit: ts } );
                                break;
                            }
                            else if ( ts > currentSession.lastVisit && tsDiffInMin( ts, currentSession.lastVisit ) <= config.SESSION_LIMIT ) {
                                if ( ts === currentSiteSessions[ i + 1 ]?.firstVisit ) {//merge sessions
                                    delete global.siteVisits[ site ][ 'sumSessionsLength' ][ currentSiteSessions[ i + 1 ][ 'id' ] ];
                                    currentSession.lastVisit = currentSiteSessions[ i + 1 ].lastVisit;
                                    currentSiteSessions.splice( i + 1, 1 );
                                    global.siteVisits[ site ][ 'sessionsCount' ] -= 1;
                                }
                                else {
                                    currentSession.lastVisit = ts;
                                }
                                global.siteVisits[ site ][ 'sumSessionsLength' ][ currentSession[ 'id' ] ] = tsDiffInSec( currentSession.lastVisit, currentSession.firstVisit );
                                break;
                            }
                            else break;
                        }
                    }
                    visitorSessions[ visitorId ] = currentVisitorSessions;
                    return visitorSessions;
                }, ( global.visitorSessions || {} ) );
            }
            for ( const fileName of files ) {
                fs.rename( `${ newStaticFilesPath }/${ fileName }`, `${ finishedStaticFilesPath }/${ fileName }`, function () { } );
            }
            console.timeEnd( funcName );
            console.log( 'end ' + funcName );
            // fs.renameSync( `${ newStaticFilesPath }/${ fileName }`, `${ finishedStaticFilesPath }/${ fileName }` );
        } catch ( err ) {
            console.error( `SessionDAL: Faild to fill sessions data, err: ${ err.stack }` );
        }
    },
    siteSessionCount: function ( siteUrl ) {
        return global.siteVisits[ siteUrl ]?.sessionsCount;
    },
    visitorUniqueSites: function ( visitorId ) {
        return global.visitorSessions[ visitorId ]?.uniqueSites;
    },

    siteSumSessionLength( siteUrl ) {
        return global.siteVisits[ siteUrl ]?.sumSessionsLength;
    }


};

async function readCsvAsJson( path ) {
    return new Promise( function ( resolve, reject ) {
        const records = [];
        const parser = fs.createReadStream( path ).pipe( parse( {
            from_line: 1,
            delimiter: ','
        } ) );

        parser.on( 'readable', function () {
            let record;
            while ( ( record = parser.read() ) !== null ) {
                records.push( record );
            }
        } );
        parser.on( 'error', function ( err ) {
            reject( `Faild to read csv file: ${ path }, err: ${ err.stack }` );
        } );
        parser.on( 'end', function () {
            resolve( records );
        } );
    } );
}