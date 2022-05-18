const SessionsDal = require( '../DAL/SessionsDAL' );
module.exports = {
    calculateSessions: async function () {
        return SessionsDal.fillSessionsData();
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
            return sessionLengthObj[ sortedKeysArr[ half ] ].toFixed(1);
        return ( sessionLengthObj[ sortedKeysArr[ half - 1 ] ] + sessionLengthObj[ sortedKeysArr[ half ] ] ) / 2.0;
    },
    numUniqueVisitedSites: function ( visitorId ) {
        const uniqueSitesObj = SessionsDal.visitorUniqueSites( visitorId );
        return uniqueSitesObj ? Object.keys( uniqueSitesObj ).length : 0;
    }
};