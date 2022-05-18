const SessionsDal = require( '../DAL/SessionsDAL' );
const { tsDiffInMin, tsDiffInSec } = require( '../utils' );
const config = require( '../../server.config' );
const fs = require( 'fs' );

module.exports = {
    calculateSessions: async function () {
        const newStaticFilesPath = `${ process.cwd() }${ config.NEW_STATIC_FILES_PATH }`;
        const files = fs.readdirSync( newStaticFilesPath );
        console.log( 'start ' + funcName );
        console.time( funcName );
        for ( let fileIndex = 0; fileIndex < files.length; fileIndex++ ) { //loop over the new files
            const fileName = files[ fileIndex ];
            console.time( fileName );
            //read csv as array
            const csvJson = await SessionsDal.readCsvRows( `${ newStaticFilesPath }/${ fileName }`, fillSessionData ); //min o(nlogn) max o(n^2)
            console.timeEnd( fileName );
        }
        for ( const fileName of files ) {
            // fs.rename( `${ newStaticFilesPath }/${ fileName }`, `${ finishedStaticFilesPath }/${ fileName }`, function () { } );
        }
        console.timeEnd( funcName );
    },
    numSessions: function ( siteUrl ) { //o(1)
        return SessionsDal.getSiteSessionCount( siteUrl ) || 0;
    },
    medianSessionsLength: function ( siteUrl ) {//o(nlog n)
        const sessionLengthObj = SessionsDal.getAllSiteSessionLength( siteUrl );
        if ( !sessionLengthObj ) return 0;
        const sortedKeysArr = Object.keys( sessionLengthObj ).sort( ( a, b ) => sessionLengthObj[ a ] - sessionLengthObj[ b ] );
        let half = Math.floor( sortedKeysArr.length / 2 );
        if ( sortedKeysArr.length % 2 )
            return sessionLengthObj[ sortedKeysArr[ half ] ].toFixed( 1 );
        return ( ( sessionLengthObj[ sortedKeysArr[ half - 1 ] ] + sessionLengthObj[ sortedKeysArr[ half ] ] ) / 2.0 ).toFixed( 1 );
    },
    numUniqueVisitedSites: function ( visitorId ) { //o(1)
        const uniqueSitesObj = SessionsDal.getVisitorUniqueSites( visitorId );
        return uniqueSitesObj ? Object.keys( uniqueSitesObj ).length : 0;
    }
};
function fillSessionData( visitorId, site, ts ) {
    //--- initializing
    let currentVisitorSessions = SessionsDal.getVisitorSessions( visitorId, site );
    let currentSiteSessions = currentVisitorSessions[ 'sessions' ][ site ];

    //--- fill first session of id+site
    if ( !currentSiteSessions.length ) {
        addNewSession( visitorId, site );
    }
    else {//loop over exists session of id+site
        for ( i = currentSiteSessions.length - 1; i >= 0; i-- ) {
            const currentSession = currentSiteSessions[ i ];
            const currentSessionId = currentSession[ 'id' ];
            if ( ts < currentSession.firstVisit ) {
                if ( tsDiffInMin( currentSession.firstVisit, ts ) <= config.SESSION_LIMIT ) {
                    currentSession.firstVisit = SessionsDal.updateSession( visitorId, site, i, 'firstVisit', ts );
                    SessionsDal.setSiteSessionLength( site, tsDiffInSec( currentSession.lastVisit, currentSession.firstVisit ), currentSessionId );
                }
                else if ( i === 0 ) {
                    addNewSession( visitorId, site );
                }
            }
            else if ( tsDiffInMin( ts, currentSession.lastVisit ) > config.SESSION_LIMIT && ts !== currentSiteSessions[ i + 1 ]?.firstVisit ) {
                addNewSession( visitorId, site, i + 1 );
                break;
            }
            else if ( ts > currentSession.lastVisit && tsDiffInMin( ts, currentSession.lastVisit ) <= config.SESSION_LIMIT ) {
                if ( ts === currentSiteSessions[ i + 1 ]?.firstVisit ) {//merge sessions
                    currentSession.lastVisit = SessionsDal.updateSession( visitorId, site, i, 'lastVisit', currentSiteSessions[ i + 1 ].lastVisit );
                    delExistsSession( visitorId, site, currentSiteSessions[ i + 1 ][ 'id' ], i + 1 );
                }
                else {
                    currentSession.lastVisit = SessionsDal.updateSession( visitorId, site, i, 'lastVisit', ts );
                }
                SessionsDal.setSiteSessionLength( site, tsDiffInSec( currentSession.lastVisit, currentSession.firstVisit ), currentSessionId );
                break;
            }
            else break;
        }
    }
}

function addNewSession( visitorId, site, position = 0 ) {
    SessionsDal.setSiteSessionLength( site, 0 );
    SessionsDal.setSiteSessionCount( site, 'increase' );
    SessionsDal.addSiteSession( visitorId, site, ts, position );
}

function delExistsSession( visitorId, site, sessionId, position = 0 ) {
    SessionsDal.delSessionLength( site, sessionId );
    SessionsDal.setSiteSessionCount( site, 'decrease' );
    SessionsDal.delSession( visitorId, site, position );
}