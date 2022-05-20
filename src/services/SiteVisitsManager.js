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
const { tsDiffInMin, tsDiffInSec } = require( '../utils/functions' );
const { VISIT_TYPE_CONST, ACTION_CONST } = require( '../utils/constants' );
const { SESSION_TIME_LIMIT, NEW_STATIC_FILES_PATH } = require( '../../server.config' );
const fs = require( 'fs' );
let timestampDiffInSeconds, timestampDiffInMinutes;

module.exports = {
    calculateSessions: async function () {
        try {
            fillTempDataFromDB();
            const newStaticFilesPath = `${ process.cwd() }${ NEW_STATIC_FILES_PATH }`;
            const files = fs.readdirSync( newStaticFilesPath ).map( fileName => readCsvRows( newStaticFilesPath, fileName, fillSessionData ) );
            console.log( `Starting load files and calculate sessions, found: ${ files.length } new files to load` );
            await Promise.all( files );
            commitDataToDB();
            console.log( `Finished load files process successfully` );
        } catch ( err ) {
            console.error( `Failed to load new files, err: ${ err.stack }` );
        }
    },
    numSessions: function ( siteUrl ) {
        return getSiteSessionCount( siteUrl ) || 0;
    },
    medianSessionsLength: function ( siteUrl ) {
        const sessionLengthObj = getAllSiteSessionLength( siteUrl );
        if ( !sessionLengthObj ) return 0;
        const sortedKeysArr = Object.keys( sessionLengthObj ).sort( ( a, b ) => sessionLengthObj[ a ] - sessionLengthObj[ b ] );
        let half = Math.floor( sortedKeysArr.length / 2 );
        if ( sortedKeysArr.length % 2 )
            return sessionLengthObj[ sortedKeysArr[ half ] ].toFixed( 1 );
        return ( ( sessionLengthObj[ sortedKeysArr[ half - 1 ] ] + sessionLengthObj[ sortedKeysArr[ half ] ] ) / 2.0 ).toFixed( 1 );
    },
    numUniqueVisitedSites: function ( visitorId ) {
        const uniqueSitesObj = getVisitorUniqueSites( visitorId );
        return uniqueSitesObj ? Object.keys( uniqueSitesObj ).length : 0;
    }
};
function fillSessionData( visitorId, site, visitTimestamp ) {
    try {
        let currentVisitorObject = getVisitorSessions( visitorId, site );
        let currentSiteSessions = currentVisitorObject.sessions;
        let currentSiteUniqueSites = currentVisitorObject.uniqueSites;
        const fillFirstSession = !currentSiteUniqueSites[site]

        if ( fillFirstSession ) {
            return addNewSession( visitorId, site, visitTimestamp );
        }
        let prevSiteSession={}
        let prevSiteSessionIteration, prevSiteSessionPosition;
        for ( i = currentSiteSessions.length - 1; i >= 0; i-- ) {
            const currentSession = currentSiteSessions[ i ];
            if ( currentSession.site !== site ) continue;
            let { firstVisit, lastVisit } = currentSession;
            // const prevIterationSession = currentSiteSessions[ i + 1 ];
            timestampDiffInMinutes = tsDiffInMin( visitTimestamp, lastVisit );
            const needCreateNewSession = timestampDiffInMinutes > SESSION_TIME_LIMIT && visitTimestamp !== prevSiteSessionIteration?.firstVisit;
            const needUpdateLastVisitOrMergeSessions = visitTimestamp > lastVisit && tsDiffInMin( visitTimestamp, lastVisit ) <= SESSION_TIME_LIMIT;
            if ( visitTimestamp < firstVisit ) {
                UpdateOrCreateSession( visitorId, site, i, visitTimestamp, currentSession );
                prevSiteSessionIteration = currentSession;
                prevSiteSessionPosition = i + 1;
                continue;
            }
            if ( needCreateNewSession ) {
                addNewSession( visitorId, site, visitTimestamp, i + 1 );
                break;
            }
            if ( needUpdateLastVisitOrMergeSessions ) {
                updateOrMergeSessions( visitorId, site, i, visitTimestamp, prevSiteSessionIteration, prevSiteSessionPosition, currentSession );
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

function UpdateOrCreateSession( visitorId, site, position, visitTimestamp, { id, firstVisit, lastVisit } ) {
    const lastIteration = i === 0;
    timestampDiffInMinutes = tsDiffInMin( firstVisit, visitTimestamp );
    const needUpdateFirstVisit = timestampDiffInMinutes <= SESSION_TIME_LIMIT;
    if ( needUpdateFirstVisit ) {
        firstVisit = updateSession( visitorId, site, position, VISIT_TYPE_CONST.FIRST_VISIT, visitTimestamp );
        timestampDiffInSeconds = tsDiffInSec( lastVisit, firstVisit );
        return setSiteSessionLength( site, timestampDiffInSeconds, id );

    }
    if ( lastIteration ) {
        addNewSession( visitorId, site, visitTimestamp );
    }

}
function updateOrMergeSessions( visitorId, site, position, visitTimestamp, prevIterationSession, prevSiteSessionPosition, { id, firstVisit, lastVisit } ) {
    const needMergeSessions = visitTimestamp === prevIterationSession?.firstVisit;
    if ( needMergeSessions ) {
        lastVisit = updateSession( visitorId, site, position, VISIT_TYPE_CONST.LAST_VISIT, prevIterationSession.lastVisit );
        delExistsSession( visitorId, site, prevIterationSession.id, prevSiteSessionPosition );
    }
    else {
        lastVisit = updateSession( visitorId, site, position, VISIT_TYPE_CONST.LAST_VISIT, visitTimestamp );
    }
    timestampDiffInSeconds = tsDiffInSec( lastVisit, firstVisit );
    setSiteSessionLength( site, timestampDiffInSeconds, id );
}