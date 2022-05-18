const { FINISHED_STATIC_FILES_PATH, FAILED_STATIC_FILES_PATH } = require( '../../server.config' );
const fs = require( 'fs' );
const { parse } = require( 'csv-parse' );
const { ACTION_CONST } = require( '../utils/index' );
// db/redis - for scale up need to store data in central place like database/cache
let visitorSessions = {}; //{id:{site:[Session]}}
let siteVisits = {}; //{site:{url:{count:1,sum:{1:sessionLength}}}} o(n^2)
let sessionsIdCounter = 0;
// end db/redis

let visitorSessionsTemp;
let siteVisitsTemp;
let sessionsIdCounterTemp;
module.exports = {
    fillDataFromDB() {
        visitorSessionsTemp = visitorSessions;
        siteVisitsTemp = siteVisits;
        sessionsIdCounterTemp = sessionsIdCounter;
    },
    commitDataToDB() {
        visitorSessions = visitorSessionsTemp;
        siteVisits = siteVisitsTemp;
        sessionsIdCounter = sessionsIdCounterTemp;
    },
    async readCsvRows( path, fileName, cb ) {
        const finishedStaticFilesPath = `${ process.cwd() }${ FINISHED_STATIC_FILES_PATH }`;
        const failedStaticFilesPath = `${ process.cwd() }${ FAILED_STATIC_FILES_PATH }`;
        return new Promise( function ( resolve, reject ) {
            const parser = fs.createReadStream( `${ path }/${ fileName }` ).pipe( parse( {
                from_line: 1,
                delimiter: ','
            } ) );

            parser.on( 'readable', function () {
                let record;
                while ( ( record = parser.read() ) !== null ) {
                    let [ visitorId, site, , ts ] = record;
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
        return visitorSessionsTemp[ visitorId ]?.uniqueSites;
    },
    getVisitorSessions( visitorId, site ) {
        visitorSessionsTemp[ visitorId ] || ( visitorSessionsTemp[ visitorId ] = { sessions: {}, uniqueSites: {} } );
        visitorSessionsTemp[ visitorId ].uniqueSites[ site ] || ( visitorSessionsTemp[ visitorId ].uniqueSites[ site ] = true );
        visitorSessionsTemp[ visitorId ].sessions[ site ] || ( visitorSessionsTemp[ visitorId ].sessions[ site ] = [] );
        return visitorSessionsTemp[ visitorId ];
    },
    addSiteSession( visitorId, site, visitTimeStamp, position ) {
        const id = sessionsIdCounterTemp;
        visitorSessionsTemp[ visitorId ].sessions[ site ].splice( position, 0, { id, firstVisit: visitTimeStamp, lastVisit: visitTimeStamp } );
    },
    updateSession( visitorId, site, position, visitType, sessionLength ) {
        visitorSessionsTemp[ visitorId ].sessions[ site ][ position ][ visitType ] = sessionLength;
        return visitorSessionsTemp[ visitorId ].sessions[ site ][ position ][ visitType ];
    },
    delSession( visitorId, site, position ) {
        visitorSessionsTemp[ visitorId ].sessions[ site ].splice( position, 1 );
    },
    getSiteVisits( site ) {
        siteVisitsTemp[ site ] || ( siteVisitsTemp[ site ] = { sessionCount: 0, sessionLength: {} } );
        return siteVisitsTemp[ site ];
    },
    getSiteSessionCount( siteUrl ) {
        return siteVisitsTemp[ siteUrl ]?.sessionCount;
    },
    setSiteSessionCount( site, ACTION ) {
        let sessionsCount = siteVisitsTemp[ site ].sessionCount;
        switch ( ACTION ) {
            case ACTION_CONST.INCREASE:
                sessionsCount++;
                break;
            case ACTION_CONST.DECREASE:
                sessionsCount--;
                break;
            default:
                sessionsCount++;
                break;
        }
    },
    getAllSiteSessionLength( siteUrl ) {
        return siteVisitsTemp[ siteUrl ]?.sessionLength;
    },
    setSiteSessionLength( site, sessionLength = 0, id = ++sessionsIdCounterTemp ) {
        siteVisitsTemp[ site ] || ( siteVisitsTemp[ site ] = { sessionCount: 0, sessionLength: {} } );
        siteVisitsTemp[ site ].sessionLength[ id ] = sessionLength;
    },
    delSessionLength( site, id ) {
        delete siteVisitsTemp[ site ].sessionLength[ id ];
    }
};