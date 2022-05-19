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
    delSession,
    fillTempDataFromDB } = require( '../DAL/SessionsDAL' );
const SessionsDal = require( '../DAL/SessionsDAL' );
const { tsDiffInMin, tsDiffInSec, VISIT_TYPE_CONST, ACTION_CONST } = require( '../utils' );
const { SESSION_TIME_LIMIT, NEW_STATIC_FILES_PATH } = require( '../../server.config' );
const fs = require( 'fs' );

module.exports = {
    calculateSessions: async function () {
        try {
            fillTempDataFromDB()
            const newStaticFilesPath = `${ process.cwd() }${ NEW_STATIC_FILES_PATH }`;
            const files = fs.readdirSync( newStaticFilesPath ).map( fileName => readCsvRows( newStaticFilesPath, fileName, fillSessionData ) );
            console.log( `Starting load files and calculate sessions, found: ${ files.length } new files to load` );
            let funcName = 'diff files';
            console.time( funcName );
            await Promise.all( files );
            console.timeEnd( funcName );
            commitDataToDB()
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
function fillSessionData( visitorId, site, visitTimestamp ) {
    try {
        //--- initializing
        let currentVisitorSessions = getVisitorSessions( visitorId, site );
        let currentSiteSessions = currentVisitorSessions.sessions[ site ];
        const fillFirstSession = !currentSiteSessions.length;

        //--- fill first session by id+site
        if ( fillFirstSession ) {
            return addNewSession( visitorId, site, visitTimestamp );
        }
        for ( i = currentSiteSessions.length - 1; i >= 0; i-- ) {
            const currentSession = currentSiteSessions[ i ];
            let { id, firstVisit, lastVisit } = currentSession;
            if ( visitTimestamp < firstVisit ) {
                const needUpdateFirstVisit = tsDiffInMin( firstVisit, visitTimestamp ) <= SESSION_TIME_LIMIT;
                if ( needUpdateFirstVisit ) {
                    firstVisit = updateSession( visitorId, site, i, VISIT_TYPE_CONST.FIRST_VISIT, visitTimestamp );
                    setSiteSessionLength( site, tsDiffInSec( lastVisit, firstVisit ), id );
                    continue;
                }
                const lastIteration = i === 0;
                if ( lastIteration ) {
                    addNewSession( visitorId, site, visitTimestamp );
                }
                continue;
            }
            const prevIterationSession = currentSiteSessions[ i + 1 ];
            const needCreateNewSession = tsDiffInMin( visitTimestamp, lastVisit ) > SESSION_TIME_LIMIT && visitTimestamp !== prevIterationSession?.firstVisit;
            if ( needCreateNewSession ) {
                addNewSession( visitorId, site, visitTimestamp, i + 1 );
                break;
            }
            const needUpdateLastVisitOrMergeSessions = visitTimestamp > lastVisit && tsDiffInMin( visitTimestamp, lastVisit ) <= SESSION_TIME_LIMIT;
            if ( needUpdateLastVisitOrMergeSessions ) {
                const needMergeSessions = visitTimestamp === prevIterationSession?.firstVisit;
                if ( needMergeSessions ) {//merge sessions
                    lastVisit = updateSession( visitorId, site, i, VISIT_TYPE_CONST.LAST_VISIT, prevIterationSession.lastVisit );
                    delExistsSession( visitorId, site, prevIterationSession.id, i + 1 );
                }
                else {
                    lastVisit = updateSession( visitorId, site, i, VISIT_TYPE_CONST.LAST_VISIT, visitTimestamp );
                }
                setSiteSessionLength( site, tsDiffInSec( lastVisit, firstVisit ), id );
                break;
            }
            break;
        }
    } catch ( err ) {
        console.error( `Failed to fill session data for row : visitorId: ${ visitorId } , site: ${ site } , timestamp: ${ visitTimestamp }, ${ err.stack }` );
    }
}

function addNewSession( visitorId, site, visitTimestamp, position = 0 ) {
    setSiteSessionLength( site );
    setSiteSessionCount( site, ACTION_CONST.INCREASE );
    addSiteSession( visitorId, site, visitTimestamp, position );
}

function delExistsSession( visitorId, site, sessionId, position = 0 ) {
    delSessionLength( site, sessionId );
    setSiteSessionCount( site, ACTION_CONST.DECREASE );
    delSession( visitorId, site, position );
}