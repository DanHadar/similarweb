const SiteVisitsManager = require( './src/services/SiteVisitsManager' );
const { NEW_STATIC_FILES_PATH, FINISHED_STATIC_FILES_PATH, FAILED_STATIC_FILES_PATH } = require( './server.config' );
const fs = require( 'fs' );
jest.setTimeout( 20000 );
// jest.mock( './src/services/SiteVisitsManager' );

describe( 'Test files loader', () => {
    test( "Writing text file to the new files folder - loader should not crash and continue to next files", async () => {
        fs.writeFileSync( `${ process.cwd() }${ NEW_STATIC_FILES_PATH }/testDan.txt`, 'test file to check file loader' );
        await SiteVisitsManager.calculateSessions();
        expect( fs.existsSync( `${ process.cwd() }${ FAILED_STATIC_FILES_PATH }/testDan.txt` ) ).toBe( true );
    } );

    test( "Writing empty csv file to the new files folder - loader should move it to finished folder", async () => {
        fs.writeFileSync( `${ process.cwd() }${ NEW_STATIC_FILES_PATH }/emptyCsv.csv`, '' );
        await SiteVisitsManager.calculateSessions();
        expect( fs.existsSync( `${ process.cwd() }${ FINISHED_STATIC_FILES_PATH }/emptyCsv.csv` ) ).toBe( true );
    } );
} );