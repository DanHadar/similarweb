module.exports = {
    tsDiffInSec: function ( firstNum, secNum ) {
        return ( firstNum - secNum ) / 1000;
    },
    tsDiffInMin: function ( firstNum, secNum ) {
        return Math.floor( ( firstNum - secNum ) / 1000 / 60 );
    }
};