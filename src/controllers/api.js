const router = require( "express" ).Router();
const SiteVisitsManager = require( '../services/SiteVisitsManager' );

router.get( '/calcSessions', async ( req, res ) => {
    try {
        console.log( `api.js/calcSessions: new Req for sessions calculation` );
        await SiteVisitsManager.calculateSessions();
        res.status( 200 ).send( 'Success' );
    } catch ( err ) {
        console.error( `Failed to load files and calculate sessions, ${ err.stack }` );
        res.status( 500 ).send( 'Internal Error' );
    }
} );

router.get( '/numSessions/:siteUrl', async ( req, res ) => {
    const { siteUrl } = req.params;
    try {
        console.log( `api.js/numSessions: new Req for site ${ siteUrl }` );
        const num = await SiteVisitsManager.numSessions( siteUrl );
        res.status( 200 ).send( `Num sessions for site ${ siteUrl } = ${ num } ` );
        console.log( `api.js/numSessions: finished Req for site ${ siteUrl } successfully` );
    } catch ( err ) {
        console.error( `Failed to get site num of sessions for site ${ siteUrl }, ${ err.stack }` );
        res.status( 500 ).send( 'Internal Error' );
    }
} );

router.get( '/medianSessionsLength/:siteUrl', async ( req, res ) => {
    const { siteUrl } = req.params;
    try {
        console.log( `api.js/medianSessionsLength: new Req for site ${ siteUrl }` );
        const num = await SiteVisitsManager.medianSessionsLength( siteUrl );
        res.status( 200 ).send( `Median session length for site ${ siteUrl } = ${ num } ` );
        console.log( `api.js/medianSessionsLength: finished Req for site ${ siteUrl } successfully` );
    } catch ( err ) {
        console.error( `Failed to get site median of session length for site ${ siteUrl }, ${ err.stack }` );
        res.status( 500 ).send( 'Internal Error' );
    }
} );

router.get( '/numUniqueVisitedSites/:visitorId', async ( req, res ) => {
    const { visitorId } = req.params;
    try {
        console.log( `api.js/numUniqueVisitedSites: new Req for visitorId ${ visitorId }` );
        const num = await SiteVisitsManager.numUniqueVisitedSites( visitorId );
        res.status( 200 ).send( `Num of unique sites for ${ visitorId } = ${ num } ` );
        console.log( `api.js/numUniqueVisitedSites: finished Req for visitorId ${ visitorId } successfully` );
    } catch ( err ) {
        console.error( `Failed to get num of unique sites for visitor ${ visitorId }, ${ err.stack }` );
        res.status( 500 ).send( 'Internal Error' );
    }
} );

module.exports = router;