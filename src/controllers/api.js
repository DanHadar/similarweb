const router = require( "express" ).Router();
const SiteVisitsManager = require( '../services/SiteVisitsManager' );

router.get( '/calcSessions', async ( req, res ) => {
    try {
        await SiteVisitsManager.calculateSessions();
        res.status( 200 ).send( 'Success' );
    } catch ( err ) {
        console.error( `Failed to load files and calculate sessions, err: ${ err.stack }` );
        res.status( 500 ).send( 'Internal Error' );
    }
} );

router.get( '/numSessions/:siteUrl', async ( req, res ) => {
    try {
        const { siteUrl } = req.params;
        const num = await SiteVisitsManager.numSessions( siteUrl );
        res.status( 200 ).send( `Num sessions for site ${ siteUrl } = ${ num } ` );
    } catch ( err ) {
        console.error( `Failed to get site num of sessions, err: ${ err.stack }` );
        res.status( 500 ).send( 'Internal Error' );
    }
} );

router.get( '/medianSessionsLength/:siteUrl', async ( req, res ) => {
    try {
        const { siteUrl } = req.params;
        const num = await SiteVisitsManager.medianSessionsLength( siteUrl );
        res.status( 200 ).send( `Median session length for site ${ siteUrl } = ${ num } ` );
    } catch ( err ) {
        console.error( `Failed to get site median of session length, err: ${ err.stack }` );
        res.status( 500 ).send( 'Internal Error' );
    }
} );

router.get( '/numUniqueVisitedSites/:visitorId', async ( req, res ) => {
    try {
        const { visitorId } = req.params;
        const num = await SiteVisitsManager.numUniqueVisitedSites( visitorId );
        res.status( 200 ).send( `Num of unique sites for ${ visitorId } = ${ num } ` );
    } catch ( err ) {
        console.error( `Failed to get num of unique sites for visitor, err: ${ err.stack }` );
        res.status( 500 ).send( 'Internal Error' );
    }
} );

module.exports = router;