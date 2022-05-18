const {
    readCsvRows,
    commitDataToDB,
    getSiteSessionCount,
    getAllSiteSessionLength,
    getVisitorUniqueSites,
    getVisitorSessions,
    updateSession,
    setSiteSessionLength,
    addSiteSession,
    setSiteSessionCount,
    delSessionLength,
    delSession } = require( '../DAL/SessionsDAL' );
const { tsDiffInMin, tsDiffInSec, ACTION_CONST, VISIT_TYPE_CONST } = require( '../utils' );
const { SESSION_TIME_LIMIT, NEW_STATIC_FILES_PATH } = require( '../../server.config' );
const fs = require( 'fs' );

module.exports = {
    calculateSessions: async function () {
        try {
            SessionsDal.fillDataFromDB();
            const newStaticFilesPath = `${ process.cwd() }${ NEW_STATIC_FILES_PATH }`;
            const files = fs.readdirSync( newStaticFilesPath ).map( fileName => readCsvRows( newStaticFilesPath, fileName, fillSessionData ) );
            console.log( `Starting load files and calculate sessions, found: ${ files.length } new files to load` );
            let funcName = 'diff files';
            console.time( funcName );
            await Promise.all( files );
            // for ( let fileIndex = 0; fileIndex < files.length; fileIndex++ ) { //loop over the new files
            //     const fileName = files[ fileIndex ];
            //     console.time( fileName );
            //     //read csv as array
            //     await SessionsDal.readCsvRows( `${ newStaticFilesPath }/${ fileName }`, fillSessionData ); //min o(nlogn) max o(n^2)
            //     console.timeEnd( fileName );
            // }
            // for ( const fileName of files ) {
            //     // fs.rename( `${ newStaticFilesPath }/${ fileName }`, `${ finishedStaticFilesPath }/${ fileName }`, function () { } );
            // }
            console.timeEnd( funcName );
            commitDataToDB();
            console.log( `Finished load files process successfully` );
        } catch ( err ) {
            console.error( `Failed to load new files, err: ${ err.stack }` );
        }
    },
    numSessions: function ( siteUrl ) { //o(1)
        return getSiteSessionCount( siteUrl ) || 0;
    },
    medianSessionsLength: function ( siteUrl ) {//o(nlog n)
        const sessionLengthObj = getAllSiteSessionLength( siteUrl );
        if ( !sessionLengthObj ) return 0;
        const sortedKeysArr = Object.keys( sessionLengthObj ).sort( ( a, b ) => sessionLengthObj[ a ] - sessionLengthObj[ b ] );
        let half = Math.floor( sortedKeysArr.length / 2 );
        if ( sortedKeysArr.length % 2 )
            return sessionLengthObj[ sortedKeysArr[ half ] ].toFixed( 1 );
        return ( ( sessionLengthObj[ sortedKeysArr[ half - 1 ] ] + sessionLengthObj[ sortedKeysArr[ half ] ] ) / 2.0 ).toFixed( 1 );
    },
    numUniqueVisitedSites: function ( visitorId ) { //o(1)
        const uniqueSitesObj = getVisitorUniqueSites( visitorId );
        return uniqueSitesObj ? Object.keys( uniqueSitesObj ).length : 0;
    }
};
function fillSessionData( visitorId, site, visitTimeStamp ) {
    try {
        //--- initializing
        let currentVisitorSessions = getVisitorSessions( visitorId, site );
        let currentSiteSessions = currentVisitorSessions.sessions[ site ];
        const fillFirstSession = !currentSiteSessions.length;
        //--- fill first session by id+site
        if ( fillFirstSession ) {
            return addNewSession( visitorId, site, visitTimeStamp );
        }
        //loop over exists session by id+site
        for ( i = currentSiteSessions.length - 1; i >= 0; i-- ) {
            const currentSession = currentSiteSessions[ i ];
            const { id, firstVisit, lastVisit } = currentSession;
            const needUpdateFirstVisit = tsDiffInMin( firstVisit, visitTimeStamp ) <= SESSION_TIME_LIMIT;
            const lastIteration = i === 0;
            const prevIterationSession = currentSiteSessions[ i + 1 ];
            const needCreateNewSession = tsDiffInMin( visitTimeStamp, lastVisit ) > SESSION_TIME_LIMIT && visitTimeStamp !== prevIterationSession?.firstVisit;
            const needUpdateLastVisitOrMergeSessions = visitTimeStamp > lastVisit && tsDiffInMin( visitTimeStamp, lastVisit ) <= SESSION_TIME_LIMIT;
            const needMergeSessions = visitTimeStamp === prevIterationSession?.firstVisit;
            if ( visitTimeStamp < firstVisit ) {
                if ( lastIteration ) {
                    addNewSession( visitorId, site, visitTimeStamp );
                    continue;
                }
                if ( needUpdateFirstVisit ) {
                    firstVisit = updateSession( visitorId, site, i, VISIT_TYPE_CONST.FIRST_VISIT, visitTimeStamp );
                    setSiteSessionLength( site, tsDiffInSec( lastVisit, firstVisit ), id );
                    continue;
                }
            }
            if ( needCreateNewSession ) {
                addNewSession( visitorId, site, visitTimeStamp, i + 1 );
                break;
            }
            if ( needUpdateLastVisitOrMergeSessions ) {
                if ( needMergeSessions ) {
                    lastVisit = updateSession( visitorId, site, i, VISIT_TYPE_CONST.LAST_VISIT, prevIterationSession.lastVisit );
                    delExistsSession( visitorId, site, prevIterationSession.id, i + 1 );
                }
                else {
                    lastVisit = updateSession( visitorId, site, i, VISIT_TYPE_CONST.LAST_VISIT, visitTimeStamp );
                }
                setSiteSessionLength( site, tsDiffInSec( lastVisit, firstVisit ), id );
                break;
            }
            break;
        }

    } catch ( err ) {
        console.error( `Failed to fill session data for row : visitorId: ${ visitorId } , site: ${ site } , timestamp: ${ visitTimeStamp }, ${ err.stack }` );
    }
}

function addNewSession( visitorId, site, visitTimeStamp, position = 0 ) {
    setSiteSessionLength( site );
    setSiteSessionCount( site, ACTION_CONST.INCREASE );
    addSiteSession( visitorId, site, visitTimeStamp, position );
}

function delExistsSession( visitorId, site, sessionId, position = 0 ) {
    delSessionLength( site, sessionId );
    setSiteSessionCount( site, ACTION_CONST.DECREASE );
    delSession( visitorId, site, position );
}