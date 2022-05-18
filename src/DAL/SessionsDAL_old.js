const Session = require( '../classes/Session' );
const config = require( '../../server.config' );
const { tsDiffInMin } = require( '../utils' );
const fs = require( 'fs' );
const { parse } = require( 'csv-parse' );

Array.prototype.removeLastSessionChecked = function ( i ) { this.splice( i + 1, 1 ); };
Array.prototype.insertSessionBetween = function ( i, obj ) { this.splice( i + 1, 0, obj ); };


class SessionsDAL {
    sessionCountBySite( siteUrl ) {
        const relevantVisitors = global.siteVisits[ siteUrl ];
        return Object.keys( relevantVisitors ).reduce( function ( numOfSessions, visitor ) {
            return numOfSessions += global.visitorSessions[ visitor ][ siteUrl ].length;
        }, 0 );
    }

    getVisitorUniqueSites( visitorId ) {
        return Object.keys( global.visitorSessions[ visitorId ] ).length;
    }

    sessionLengthMedianBySite( siteUrl ) {
        const relevantVisitors = global.siteVisits[ siteUrl ];
        const sumSessionsAndCounter = Object.keys( relevantVisitors ).reduce( function ( sessionsArr, visitor ) {
            global.visitorSessions[ visitor ][ siteUrl ].forEach( function ( session ) {
                sessionsArr[ 0 ] += session.sessionLength();
                sessionsArr[ 1 ] += 1;
            } );
            return sessionsArr;
        }, [ 0, 0 ] );
        return sumSessionsAndCounter[ 0 ] / sumSessionsAndCounter[ 1 ];
    }
    async fillSessionsData() {
        global.siteVisits || ( global.siteVisits = {} ); //{url:{id1:true,id2:true},url2:{id2:true,id3:true}}
        global.visitorSessions || ( global.visitorSessions = {} ); //{id1:{url:[session,session],url2:[session,session]}}
        try {
            console.log( 'SessionDal: Starting fill session data' );
            const newStaticFilesPath = `${ process.cwd() }${ config.NEW_STATIC_FILES_PATH }`;
            const finishedStaticFilesPath = `${ process.cwd() }${ config.FINISHED_STATIC_FILES_PATH }`;
            const failedStaticFilesPath = `${ process.cwd() }${ config.FAILED_STATIC_FILES_PATH }`;
            const files = fs.readdirSync( newStaticFilesPath );
            for ( let fileIndex = 0; fileIndex < files.length; fileIndex++ ) {
                const fileName = files[ fileIndex ];
                console.time( fileName );
                let visitorId, site, ts;
                try {
                    const csvJson = await this.readCsvAsJson( `${ newStaticFilesPath }/${ fileName }` );
                    csvJson.forEach( function ( pageView, rowIndex ) {
                        const start = Date.now();
                        if ( rowIndex % 5000 === 0 || rowIndex + 1 === csvJson.length ) console.log( `File number: ${ fileIndex + 1 }/${ files.length }, Row number: ${ rowIndex }/${ csvJson.length - 1 }` ); //indicate of process
                        try {
                            [ visitorId, site, , ts ] = pageView;
                            ts = ( ts ) * 1000;
                            const siteVisitsObj = global.siteVisits[ site ] || {};
                            if ( !siteVisitsObj[ visitorId ] ) global.siteVisits[ site ] = { ...siteVisitsObj, [ visitorId ]: true }; //fill who has visited the site
                            const visitorSessions = ( global.visitorSessions[ visitorId ] || {} )[ site ];
                            if ( !visitorSessions ) { //first visitor session in site
                                global.visitorSessions[ visitorId ] || ( global.visitorSessions[ visitorId ] = {} );
                                global.visitorSessions[ visitorId ][ site ] = [ { lastVisit: ts, firstVisit: ts } ];
                            }
                            else {
                                let lastSessionCheck;
                                let i;
                                console.log( visitorSessions.length );
                                for ( i = visitorSessions.length - 1; i >= 0; i-- ) {
                                    const currentSession = visitorSessions[ i ];
                                    // const newPageViewToSessRes = currentSession.newPageView( ts, lastSessionCheck );
                                    let newPageViewToSessRes;
                                    if ( ts > currentSession.firstVisit ) {
                                        if ( ts > currentSession.lastVisit ) {
                                            if ( tsDiffInMin( ts, currentSession.lastVisit ) > config.SESSION_LIMIT ) newPageViewToSessRes = [ ts ];
                                            else {
                                                if ( lastSessionCheck && tsDiffInMin( lastSessionCheck[ 0 ], ts ) <= config.SESSION_LIMIT ) {
                                                    currentSession.lastVisit = lastSessionCheck[ 1 ]; // merge sessions
                                                    newPageViewToSessRes = false;
                                                }
                                                else {
                                                    currentSession.lastVisit = ts; //only update last visit to new page view timestamp
                                                    newPageViewToSessRes = [];
                                                }
                                            }
                                        }
                                        else newPageViewToSessRes = []; //between session time
                                    }
                                    else {
                                        if ( tsDiffInMin( currentSession.firstVisit, ts ) <= config.SESSION_LIMIT ) currentSession.firstVisit = ts; //update session first visit with new page view timestamp
                                        newPageViewToSessRes = [ currentSession.firstVisit, currentSession.lastVisit ]; //return data for next iteration lastSessionCheck
                                    }
                                    if ( !newPageViewToSessRes ) {
                                        // return visitorSessions.removeLastSessionChecked( i );
                                        // return visitorSessions.splice( i + 1, 1 );
                                    }
                                    else if ( !newPageViewToSessRes.length ) return;
                                    else if ( newPageViewToSessRes.length === 1 ) {
                                        if ( !lastSessionCheck || tsDiffInMin( lastSessionCheck[ 0 ], ts ) > config.SESSION_LIMIT ) {
                                            // visitorSessions.insertSessionBetween( i, { lastVisit: ts, firstVisit: ts } );
                                            // visitorSessions.splice( i + 1, 0, { lastVisit: ts, firstVisit: ts } );
                                            visitorSessions.push( { lastVisit: ts, firstVisit: ts } );
                                        }
                                        return;
                                    }
                                    else lastSessionCheck = newPageViewToSessRes;
                                }
                            }
                        } catch ( err ) {
                            console.error( `SessionDAL: Failed to process row in file ${ fileName } \nRow details: ${ visitorId }, ${ site }, ${ ts } \nerr: ${ err.stack }` );
                        }
                        const end = Date.now();
                        // console.log( end - start );
                    } );
                    // fs.renameSync( `${ newStaticFilesPath }/${ fileName }`, `${ finishedStaticFilesPath }/${ fileName }` );
                } catch ( err ) {
                    console.error( `SessionDAL: Failed to read and process file ${ fileName } \nerr: ${ err.stack }` );
                    fs.renameSync( `${ newStaticFilesPath }/${ fileName }`, `${ failedStaticFilesPath }/${ fileName }` );
                }
                finally {
                    console.timeEnd( fileName );
                }

            }
            let totalSessions = 0;
            // for ( let z = 0; z < Object.keys( global.visitorSessions ).length; z++ ) {
            //     const visitor = Object.keys( global.visitorSessions )[ z ];
            //     for ( let x = 0; x < Object.keys( global.visitorSessions[ visitor ] ).length; x++ ) {
            //         const site = Object.keys( global.visitorSessions[ visitor ] )[ x ];
            //         totalSessions += global.visitorSessions[ visitor ][ site ].length;
            //         if ( global.visitorSessions[ visitor ][ site ].length > 1 )
            //             console.log( visitor, site );
            //     }

            // }
            console.log( totalSessions );
        } catch ( err ) {
            console.error( `SessionDAL: Faild to fill sessions data, err: ${ err.stack }` );
        }
    }

    async readCsvAsJson( path ) {
        return new Promise( function ( resolve, reject ) {
            const records = [];
            const parser = fs.createReadStream( path ).pipe( parse( {
                from_line: 1,
                delimiter: ','
            } ) );

            parser.on( 'readable', function () {
                let record;
                while ( ( record = parser.read() ) !== null ) {
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
    }
}


module.exports = SessionsDAL;