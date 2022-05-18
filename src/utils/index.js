module.exports = {
    tsDiffInSec: function ( firstNum, secNum ) {
        if ( ( ( firstNum - secNum ) / 1000 ).toString().includes( '.' ) ) console.log( 'dan' );
        return ( firstNum - secNum ) / 1000;
    },
    tsDiffInMin: function ( firstNum, secNum ) {
        return Math.floor( ( firstNum - secNum ) / 1000 / 60 );
    },
    ACTION_CONST: {
        INCREASE: 'increase',
        DECREASE: 'decrease'
    },
    VISIT_TYPE_CONST: {
        FIRST_VISIT: 'firstVisit',
        LAST_VISIT: 'lastVisit'
    }
};