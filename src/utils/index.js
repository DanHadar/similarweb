module.exports = {
    tsDiffInSec: function ( firstNum, secNum ) {
        if( (( firstNum - secNum ) / 1000).toString().includes('.')) console.log('dan');
        return ( firstNum - secNum ) / 1000;
    },
    tsDiffInMin: function ( firstNum, secNum ) {
        return Math.floor( ( firstNum - secNum ) / 1000 / 60 );
    }
};