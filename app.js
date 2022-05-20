

const app = require( "express" )();
app.use( "/api", require( "./src/controllers/api" ) );
app.use( "/*", ( req, res ) => {
  res.status( 404 ).send( 'No resource Found' );
} );

module.exports = app;