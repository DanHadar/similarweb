const SessionsDal = require( '../DAL/SessionsDAL' );
const { tsDiffInMin, tsDiffInSec } = require( '../utils' );
const config = require( '../../server.config' );
const fs = require( 'fs' );

module.exports = {
    calculateSessions: async function () {
        // return SessionsDal.loadData();
        const newStaticFilesPath = `${ process.cwd() }${ config.NEW_STATIC_FILES_PATH }`;
        const files = fs.readdirSync( newStaticFilesPath );
        let funcName = 'diff files';
        console.log( 'start ' + funcName );
        console.time( funcName );
        for ( let fileIndex = 0; fileIndex < files.length; fileIndex++ ) { //loop over the new files
            const fileName = files[ fileIndex ];
            console.time(fileName)
            const csvJson = await SessionsDal.readCsvRows( `${ newStaticFilesPath }/${ fileName }` ); //read csv as array
            console.timeEnd(fileName)
            // csvJson.forEach( function ( row ) { //loop over rows in the csv
            //     //--- initializing
            //     [ visitorId, site, , ts ] = row;
            //     ts = ts * 1000;
            //     let currentVisitorSessions = SessionsDal.getVisitorSessions( visitorId, site );
            //     let currentSiteSessions = currentVisitorSessions[ 'sessions' ][ site ];

            //     //--- fill first session of id+site
            //     if ( !currentSiteSessions.length ) {
            //         SessionsDal.setSessionLength( site, 0 );
            //         SessionsDal.setSiteSessionCount( site, 'increase' );
            //         SessionsDal.addSiteSession( visitorId, site, ts );
            //         // currentSiteSessions.push( { id: sessionsIdCounter, firstVisit: ts, lastVisit: ts } );
            //     }
            //     else {//loop over exists session of id+site
            //         for ( i = currentSiteSessions.length - 1; i >= 0; i-- ) {
            //             const currentSession = currentSiteSessions[ i ];
            //             const currentSessionId = currentSession[ 'id' ];
            //             if ( ts < currentSession.firstVisit ) {
            //                 if ( tsDiffInMin( currentSession.firstVisit, ts ) <= config.SESSION_LIMIT ) {
            //                     currentSession.firstVisit = SessionsDal.updateSession( visitorId, site, i, 'firstVisit', ts );
            //                     SessionsDal.setSessionLength( site, tsDiffInSec( currentSession.lastVisit, currentSession.firstVisit ), currentSessionId );
            //                 }
            //                 else if ( i === 0 ) {
            //                     SessionsDal.setSessionLength( site, 0 );
            //                     SessionsDal.setSiteSessionCount( site, 'increase' );
            //                     SessionsDal.addSiteSession( visitorId, site, ts );
            //                     // currentSiteSessions.splice( 0, 0, { id: sessionsIdCounter, firstVisit: ts, lastVisit: ts } );
            //                 }
            //             }
            //             else if ( tsDiffInMin( ts, currentSession.lastVisit ) > config.SESSION_LIMIT && ts !== currentSiteSessions[ i + 1 ]?.firstVisit ) {
            //                 SessionsDal.setSessionLength( site, 0 );
            //                 SessionsDal.setSiteSessionCount( site, 'increase' );
            //                 SessionsDal.addSiteSession( visitorId, site, ts, i + 1 );
            //                 // currentSiteSessions.splice( i + 1, 0, { id: sessionsIdCounter, firstVisit: ts, lastVisit: ts } );
            //                 break;
            //             }
            //             else if ( ts > currentSession.lastVisit && tsDiffInMin( ts, currentSession.lastVisit ) <= config.SESSION_LIMIT ) {
            //                 if ( ts === currentSiteSessions[ i + 1 ]?.firstVisit ) {//merge sessions
            //                     SessionsDal.delSessionLength( site, currentSiteSessions[ i + 1 ][ 'id' ] );
            //                     currentSession.lastVisit = SessionsDal.updateSession( visitorId, site, i, 'lastVisit', currentSiteSessions[ i + 1 ].lastVisit );;
            //                     // currentSession.lastVisit = currentSiteSessions[ i + 1 ].lastVisit;
            //                     // currentSiteSessions.splice( i + 1, 1 );
            //                     SessionsDal.delSession( visitorId, site, i + 1 );
            //                     SessionsDal.setSiteSessionCount( site, 'decrease' );
            //                 }
            //                 else {
            //                     currentSession.lastVisit = SessionsDal.updateSession( visitorId, site, i, 'lastVisit', ts );
            //                     // currentSession.lastVisit = ts;
            //                 }
            //                 SessionsDal.setSessionLength( site, tsDiffInSec( currentSession.lastVisit, currentSession.firstVisit ), currentSessionId );
            //                 break;
            //             }
            //             else break;
            //         }
            //     }
            //     // finalObj[ visitorId ] = currentVisitorSessions;
            // } );
        }
        for ( const fileName of files ) {
            // fs.rename( `${ newStaticFilesPath }/${ fileName }`, `${ finishedStaticFilesPath }/${ fileName }`, function () { } );
        }
        console.timeEnd( funcName );
        console.log( 'end ' + funcName );
    },
    numSessions: function ( siteUrl ) {
        return SessionsDal.siteSessionCount( siteUrl ) || 0;
    },
    medianSessionsLength: function ( siteUrl ) {
        const sessionLengthObj = SessionsDal.siteSumSessionLength( siteUrl );
        if ( !sessionLengthObj ) return 0;
        const sortedKeysArr = Object.keys( sessionLengthObj ).sort( ( a, b ) => sessionLengthObj[ a ] - sessionLengthObj[ b ] );
        let half = Math.floor( sortedKeysArr.length / 2 );
        if ( sortedKeysArr.length % 2 )
            return sessionLengthObj[ sortedKeysArr[ half ] ].toFixed( 1 );
        return ( ( sessionLengthObj[ sortedKeysArr[ half - 1 ] ] + sessionLengthObj[ sortedKeysArr[ half ] ] ) / 2.0 ).toFixed( 1 );
    },
    numUniqueVisitedSites: function ( visitorId ) {
        const uniqueSitesObj = SessionsDal.visitorUniqueSites( visitorId );
        return uniqueSitesObj ? Object.keys( uniqueSitesObj ).length : 0;
    }
};
function fillSessionData(){
    
}