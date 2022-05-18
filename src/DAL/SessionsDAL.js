const config = require( '../../server.config' );
const fs = require( 'fs' );
const { parse } = require( 'csv-parse' );

let visitorSessions = {}; //{id:{site:[Session]}}
let siteVisits = {}; //{site:{url:{count:1,sum:{1:sessionLength}}}} o(n^2)
let sessionsIdCounter = 0;

module.exports = {
    async readCsvRows( path, fileName, cb ) {
        const finishedStaticFilesPath = `${ process.cwd() }${ config.FINISHED_STATIC_FILES_PATH }`;
        const failedStaticFilesPath = `${ process.cwd() }${ config.FAILED_STATIC_FILES_PATH }`;
        return new Promise( function ( resolve, reject ) {
            const records = [];
            const parser = fs.createReadStream( `${ path }/${ fileName }` ).pipe( parse( {
                from_line: 1,
                delimiter: ','
            } ) );

            parser.on( 'readable', function () {
                let record;
                while ( ( record = parser.read() ) !== null ) {
                    [ visitorId, site, , ts ] = record;
                    ts = ts * 1000;
                    cb( visitorId, site, ts );
                }
            } );
            parser.on( 'error', function ( err ) {
                err.stack = `Faild to read csv file: ${ path }/${ fileName }, err: ${ err.stack }`;
                reject( err );
                // fs.rename( `${ path }/${ fileName }`, `${ failedStaticFilesPath }/${ fileName }`, function () { } );
            } );
            parser.on( 'end', function () {
                // fs.rename( `${ path }/${ fileName }`, `${ finishedStaticFilesPath }/${ fileName }`, function () { } );
                resolve();
            } );
        } );
    },

    getVisitorUniqueSites( visitorId ) {
        return visitorSessions[ visitorId ]?.uniqueSites;
    },
    getVisitorSessions( visitorId, site ) {
        visitorSessions[ visitorId ] || ( visitorSessions[ visitorId ] = { sessions: {}, uniqueSites: {} } );
        visitorSessions[ visitorId ][ 'uniqueSites' ][ site ] || ( visitorSessions[ visitorId ][ 'uniqueSites' ][ site ] = true );
        visitorSessions[ visitorId ][ 'sessions' ][ site ] || ( visitorSessions[ visitorId ][ 'sessions' ][ site ] = [] );
        return visitorSessions[ visitorId ];
    },
    addSiteSession( visitorId, site, visitTs, position ) {
        const id = this.getNewSessionId();
        visitorSessions[ visitorId ][ 'sessions' ][ site ].splice( position, 0, { id, firstVisit: visitTs, lastVisit: visitTs } );
    },
    updateSession( visitorId, site, position, visitType, newValue ) {
        visitorSessions[ visitorId ][ 'sessions' ][ site ][ position ][ visitType ] = newValue;
        return visitorSessions[ visitorId ][ 'sessions' ][ site ][ position ][ visitType ];
    },
    delSession( visitorId, site, position ) {
        visitorSessions[ visitorId ][ 'sessions' ][ site ].splice( position, 1 );
    },
    getSiteVisits( site ) {
        siteVisits[ site ] || ( siteVisits[ site ] = { sessionCount: 0, sessionLength: {} } );
        return siteVisits[ site ];
    },
    getSiteSessionCount( siteUrl ) {
        return siteVisits[ siteUrl ]?.sessionCount;
    },
    setSiteSessionCount( site, action ) {
        action === 'increase' ? siteVisits[ site ][ 'sessionCount' ] += 1 : siteVisits[ site ][ 'sessionCount' ] -= 1;
    },
    getAllSiteSessionLength( siteUrl ) {
        return siteVisits[ siteUrl ]?.sessionLength;
    },
    setSiteSessionLength( site, newValue, id = this.getNewSessionId( true ) ) {
        siteVisits[ site ] || ( siteVisits[ site ] = { sessionCount: 0, sessionLength: {} } );
        siteVisits[ site ][ 'sessionLength' ][ id ] = newValue;
    },
    delSessionLength( site, id ) {
        delete siteVisits[ site ][ 'sessionLength' ][ id ];
    },
    getNewSessionId( increaseNeeded ) {
        return increaseNeeded ? ++sessionsIdCounter : sessionsIdCounter;
    }
};