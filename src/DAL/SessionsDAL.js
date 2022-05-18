const Session = require( '../classes/Session' );
const config = require( '../../server.config' );
const { tsDiffInMin, tsDiffInSec } = require( '../utils' );
const fs = require( 'fs' );
const { parse } = require( 'csv-parse' );

let visitorSessions = {}; //{id:{site:[Session]}}
let siteVisits = {}; //{site:{url:{count:1,sum:{1:sessionLength}}}} o(n^2)
let sessionsIdCounter = 0;

module.exports = {
    async readCsvRows( path, visitorSessionsObj, siteVisitsObj, cb ) {
        return new Promise( function ( resolve, reject ) {
            const records = [];
            const parser = fs.createReadStream( path ).pipe( parse( {
                from_line: 1,
                delimiter: ','
            } ) );

            parser.on( 'readable', function () {
                let record;
                while ( ( record = parser.read() ) !== null ) {
                    //--- initializing
                    // [ visitorId, site, , ts ] = row;
                    // ts = ts * 1000;
                    // let currentVisitorSessions = visitorSessionsObj[ visitorId ];
                    // currentVisitorSessions || ( currentVisitorSessions = { sessions: {}, uniqueSites: {} } );
                    // currentVisitorSessions[ 'uniqueSites' ][ site ] || ( currentVisitorSessions[ 'uniqueSites' ][ site ] = true );
                    // currentVisitorSessions[ 'sessions' ][ site ] || ( currentVisitorSessions[ 'sessions' ][ site ] = [] );
                    // siteVisitsObj[ site ] || ( siteVisitsObj[ site ] = { sessionCount: 0, sessionLength: {} } );
                    // let currentSiteSessions = currentVisitorSessions[ 'sessions' ][ site ];
                    // cb();
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
    },

    visitorUniqueSites( visitorId ) {
        return visitorSessions[ visitorId ]?.uniqueSites;
    },
    getVisitorSessions( visitorId, site ) {
        visitorSessions[ visitorId ] || ( visitorSessions[ visitorId ] = { sessions: {}, uniqueSites: {} } );
        visitorSessions[ visitorId ][ 'uniqueSites' ][ site ] || ( visitorSessions[ visitorId ][ 'uniqueSites' ][ site ] = true );
        visitorSessions[ visitorId ][ 'sessions' ][ site ] || ( visitorSessions[ visitorId ][ 'sessions' ][ site ] = [] );
        return visitorSessions[ visitorId ];
    },
    addSiteSession( visitorId, site, visitTs, position = 0 ) {
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
    siteSessionCount( siteUrl ) {
        return siteVisits[ siteUrl ]?.sessionCount;
    },
    setSiteSessionCount( site, action ) {
        action === 'increase' ? siteVisits[ site ][ 'sessionCount' ] += 1 : siteVisits[ site ][ 'sessionCount' ] -= 1;
    },
    siteSumSessionLength( siteUrl ) {
        return siteVisits[ siteUrl ]?.sessionLength;
    },
    setSessionLength( site, newValue, id = this.getNewSessionId( true ) ) {
        siteVisits[ site ] || ( siteVisits[ site ] = { sessionCount: 0, sessionLength: {} } );
        siteVisits[ site ][ 'sessionLength' ][ id ] = newValue;
    },
    delSessionLength( site, id ) {
        delete siteVisits[ site ][ 'sessionLength' ][ id ];
    },
    getNewSessionId( increaseNeeded ) {
        return increaseNeeded ? ++sessionsIdCounter : sessionsIdCounter;
    }
}