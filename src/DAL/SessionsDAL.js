const config = require( '../../server.config' );
const fs = require( 'fs' );
const { parse } = require( 'csv-parse' );
const { ACTION_CONST } = require( '../utils/constants' );

// simulate third party database/cache - for scale up need to store data in central place like database/cache
let visitorSessions = {};
let siteVisits = {};
let sessionsIdCounter = 0;
// end simulation

let visitorSessionsTemp;
let siteVisitsTemp;
let sessionsIdCounterTemp;

module.exports = {
    fillTempDataFromDB() {
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
        const finishedStaticFilesPath = `${ process.cwd() }${ config.FINISHED_STATIC_FILES_PATH }`;
        const failedStaticFilesPath = `${ process.cwd() }${ config.FAILED_STATIC_FILES_PATH }`;
        if ( fileName.slice( fileName.length - 3 ).toLowerCase() !== 'csv' ) {
            console.error( `Invalid file type (only csv supported) found in new files folder - ${ fileName }` );
            return fs.rename( `${ path }/${ fileName }`, `${ failedStaticFilesPath }/${ fileName }`, function () { } );
        }
        return new Promise( function ( resolve, reject ) {
            const parser = fs.createReadStream( `${ path }/${ fileName }` ).pipe( parse( {
                from_line: 1,
                delimiter: ','
            } ) );

            parser.on( 'readable', function () {
                let record;
                while ( ( record = parser.read() ) !== null ) {
                    [ visitorId, site, , timestamp ] = record;
                    if ( !visitorId.length || !site.length || !timestamp.length ) {
                        console.warn( `Invalid row data from csv: ${ fileName }, reason: empty value, row data: visitorId: ${ visitorId } site: ${ site } timestamp: ${ timestamp }` );
                        continue;
                    }
                    if ( timestamp.length < 10 ) {
                        console.warn( `Invalid row data from csv: ${ fileName }, reason: timestamp length lower then the minimum length (10) \nrow data: visitorId: ${ visitorId } site: ${ site } timestamp: ${ timestamp }` );
                        continue;
                    }
                    timestamp = timestamp * 1000;
                    cb( visitorId, site, timestamp );
                }
            } );
            parser.on( 'error', function ( err ) {
                err.stack = `Faild to read csv file: ${ path }/${ fileName }, err: ${ err.stack }`;
                ;
                fs.rename( `${ path }/${ fileName }`, `${ failedStaticFilesPath }/${ fileName }`, function () { reject( err ); } );
            } );
            parser.on( 'end', function () {
                fs.rename( `${ path }/${ fileName }`, `${ finishedStaticFilesPath }/${ fileName }`, function () { resolve(); } );

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
    addSiteSession( visitorId, site, visitTimestamp, position ) {
        const id = sessionsIdCounterTemp;
        visitorSessionsTemp[ visitorId ].sessions[ site ].splice( position, 0, { id, firstVisit: visitTimestamp, lastVisit: visitTimestamp } );
    },
    updateSession( visitorId, site, position, visitType, newValue ) {
        visitorSessionsTemp[ visitorId ].sessions[ site ][ position ][ visitType ] = newValue;
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
    setSiteSessionCount( site, action ) {
        let siteVisitsObj = siteVisitsTemp[ site ];
        if ( action === ACTION_CONST.INCREASE ) return siteVisitsObj.sessionCount += 1;
        siteVisitsObj.sessionCount -= 1;
    },
    getAllSiteSessionLength( siteUrl ) {
        return siteVisitsTemp[ siteUrl ]?.sessionLength;
    },
    setSiteSessionLength( site, sessionLen = 0, id = ++sessionsIdCounterTemp ) {
        siteVisitsTemp[ site ] || ( siteVisitsTemp[ site ] = { sessionCount: 0, sessionLength: {} } );
        siteVisitsTemp[ site ].sessionLength[ id ] = sessionLen;
    },
    delSessionLength( site, id ) {
        delete siteVisitsTemp[ site ].sessionLength[ id ];
    }
};