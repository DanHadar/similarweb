const SiteVisitsManager = require( './src/services/SiteVisitsManager' );
const { NEW_STATIC_FILES_PATH, FINISHED_STATIC_FILES_PATH, FAILED_STATIC_FILES_PATH } = require( './server.config' );
const fs = require( 'fs' );
jest.setTimeout( 20000 );

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

    test( "Writing broken csv file (empty visitorId) to the new files folder - loader should continue to the next row", async () => {
        fs.writeFileSync( `${ process.cwd() }${ NEW_STATIC_FILES_PATH }/emptyCsv.csv`, ',www.s_8.com,www.s_8.com/page_1,1347844442\ndan,www.s_8.com,www.s_8.com/page_1,1347844442' );
        await SiteVisitsManager.calculateSessions();
        expect( fs.existsSync( `${ process.cwd() }${ FINISHED_STATIC_FILES_PATH }/emptyCsv.csv` ) ).toBe( true );
        const numOfUniqueSites = await SiteVisitsManager.numUniqueVisitedSites( 'dan' );
        expect(numOfUniqueSites).toEqual( 1 );
    } );

    test( "Writing broken csv file (empty site) to the new files folder - loader should continue to the next row", async () => {
        fs.writeFileSync( `${ process.cwd() }${ NEW_STATIC_FILES_PATH }/emptyCsv.csv`, 'dan,,www.s_8.com/page_1,1347844442\ndan,www.s_8.com,www.s_8.com/page_1,1347844442' );
        await SiteVisitsManager.calculateSessions();
        expect( fs.existsSync( `${ process.cwd() }${ FINISHED_STATIC_FILES_PATH }/emptyCsv.csv` ) ).toBe( true );
        const numOfUniqueSites = await SiteVisitsManager.numUniqueVisitedSites( 'dan' );
        expect(numOfUniqueSites).toEqual( 1 );
    } );

    test( "Writing broken csv file (empty timestamp) to the new files folder - loader should continue to the next row", async () => {
        fs.writeFileSync( `${ process.cwd() }${ NEW_STATIC_FILES_PATH }/emptyCsv.csv`, 'dan,www.s_8.com,www.s_8.com/page_1,\ndan,www.s_8.com,www.s_8.com/page_1,1347844442' );
        await SiteVisitsManager.calculateSessions();
        expect( fs.existsSync( `${ process.cwd() }${ FINISHED_STATIC_FILES_PATH }/emptyCsv.csv` ) ).toBe( true );
        const numOfUniqueSites = await SiteVisitsManager.numUniqueVisitedSites( 'dan' );
        expect(numOfUniqueSites).toEqual( 1 );
    } );

    test( "Writing broken csv file (short timestamp) to the new files folder - loader should continue to the next row", async () => {
        fs.writeFileSync( `${ process.cwd() }${ NEW_STATIC_FILES_PATH }/emptyCsv.csv`, 'dan,www.s_8.com,www.s_8.com/page_1,13478\ndan,www.s_8.com,www.s_8.com/page_1,1347844442' );
        await SiteVisitsManager.calculateSessions();
        expect( fs.existsSync( `${ process.cwd() }${ FINISHED_STATIC_FILES_PATH }/emptyCsv.csv` ) ).toBe( true );
        const numOfUniqueSites = await SiteVisitsManager.numUniqueVisitedSites( 'dan' );
        expect(numOfUniqueSites).toEqual( 1 );
    } );
} );