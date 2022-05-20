

const app = require( "express" )();
app.use( "/api", require( "./src/controllers/api" ) );
app.use( "/*", ( req, res ) => {
  console.log('hiiii')
  res.status( 404 ).send( 'No resource Found' );
  console.log('byeeee')
} );

module.exports = app;