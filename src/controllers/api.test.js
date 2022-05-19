const request = require( "supertest" );
const app = require( '../../app' );
jest.setTimeout( 20000 );

describe( "Test the api endpoints", () => {
    describe( "--calcSessions endpoint--", () => {
        test( "It should fill data of sessions and then return 200 Success", done => {
            request( app )
                .get( "/api/calcSessions" )
                .then( response => {
                    expect( response.statusCode ).toBe( 200 );
                    expect( response.text ).toMatch( 'Success' );
                    done();
                } );
        } );
    } );
    describe( "--numSessions endpoint--", () => {

        test( "Send request to with param - it should return num of sessions and the param", done => {
            request( app )
                .get( "/api/numSessions/www.s_1.com" )
                .then( response => {
                    expect( response.statusCode ).toBe( 200 );
                    expect( response.text ).toMatch( /www.s_1.com/ );
                    expect( +response.text.slice( response.text.indexOf( '= ' ) + 2 ).trim() ).toBeGreaterThanOrEqual( 0 );
                    done();
                } );
        } );

        test( "Send request to without param - it should return 404", done => {
            request( app )
                .get( "/api/numSessions" )
                .then( response => {
                    expect( response.statusCode ).toBe( 404 );
                    expect( response.text ).toMatch( /No resource Found/ );
                    done();
                } );
        } );

        test( "Send request to with site that not exists - it should return num session = 0 and status code 200", done => {
            request( app )
                .get( "/api/numSessions/blabladan" )
                .then( response => {
                    expect( response.statusCode ).toBe( 200 );
                    expect( response.text ).toMatch( /blabladan/ );
                    expect( +response.text.slice( response.text.indexOf( '= ' ) + 2 ).trim() ).toEqual( 0 );
                    done();
                } );
        } );
    } );
    describe( "--medianSessionsLength endpoint--", () => {

        test( "Send request to with param - it should return num of sessions and the param", done => {
            request( app )
                .get( "/api/medianSessionsLength/www.s_1.com" )
                .then( response => {
                    expect( response.statusCode ).toBe( 200 );
                    expect( response.text ).toMatch( /www.s_1.com/ );
                    expect( +response.text.slice( response.text.indexOf( '= ' ) + 2 ).trim() ).toBeGreaterThanOrEqual( 0 );
                    done();
                } );
        } );

        test( "Send request to without param - it should return 404", done => {
            request( app )
                .get( "/api/medianSessionsLength" )
                .then( response => {
                    expect( response.statusCode ).toBe( 404 );
                    expect( response.text ).toMatch( /No resource Found/ );
                    done();
                } );
        } );

        test( "Send request to with site that not exists - it should return num session = 0 and status code 200", done => {
            request( app )
                .get( "/api/medianSessionsLength/blabladan" )
                .then( response => {
                    expect( response.statusCode ).toBe( 200 );
                    expect( response.text ).toMatch( /blabladan/ );
                    expect( +response.text.slice( response.text.indexOf( '= ' ) + 2 ).trim() ).toEqual( 0 );
                    done();
                } );
        } );
    } );
    describe( "--numUniqueVisitedSites endpoint--", () => {

        test( "Send request to with param - it should return num of sessions and the param", done => {
            request( app )
                .get( "/api/numUniqueVisitedSites/visitor_1" )
                .then( response => {
                    expect( response.statusCode ).toBe( 200 );
                    expect( response.text ).toMatch( /visitor_1/ );
                    expect( +response.text.slice( response.text.indexOf( '= ' ) + 2 ).trim() ).toBeGreaterThanOrEqual( 0 );
                    done();
                } );
        } );

        test( "Send request to without param - it should return 404", done => {
            request( app )
                .get( "/api/numUniqueVisitedSites" )
                .then( response => {
                    expect( response.statusCode ).toBe( 404 );
                    expect( response.text ).toMatch( /No resource Found/ );
                    done();
                } );
        } );

        test( "Send request to with site that not exists - it should return num session = 0 and status code 200", done => {
            request( app )
                .get( "/api/numUniqueVisitedSites/blabladan" )
                .then( response => {
                    expect( response.statusCode ).toBe( 200 );
                    expect( response.text ).toMatch( /blabladan/ );
                    expect( +response.text.slice( response.text.indexOf( '= ' ) + 2 ).trim() ).toEqual( 0 );
                    done();
                } );
        } );
    } );

} );