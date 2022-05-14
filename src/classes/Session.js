const config = require( '../../server.config' );
const { tsDiffInSec, tsDiffInMin } = require( '../utils' );
class Session {
    constructor ( _visitTs ) {
        // constructor ( _visitorId, _siteUrl, _visitTs ) {
        // this.visitorId = _visitorId;
        // this.siteUrl = _siteUrl;
        if ( isNaN( _visitTs ) ) throw Error( `invalid timestamp: ${ _visitTs }` );
        this.firstVisit = _visitTs;
        this.lastVisit = _visitTs;

    }
    sessionLength() {
        return tsDiffInSec( this.lastVisit, this.firstVisit );
    }
    newPageView( ts, lastSessionCheck ) {
        if ( ts > this.firstVisit ) {
            if ( ts > this.lastVisit ) {
                if ( tsDiffInMin( ts, this.lastVisit ) > config.SESSION_LIMIT ) return [ ts ];
                else {
                    if ( lastSessionCheck && tsDiffInMin( lastSessionCheck[ 0 ], ts ) <= config.SESSION_LIMIT ) {
                        // this.lastVisit = lastSessionCheck[ 1 ]; // merge sessions
                        return false;
                    }
                    else {
                        this.lastVisit = ts; //only update last visit to new page view timestamp
                        return [];
                    }
                }
            }
            else return []; //between session time
        }
        else {
            if ( tsDiffInMin( this.firstVisit, ts ) <= config.SESSION_LIMIT ) this.firstVisit = ts; //update session first visit with new page view timestamp
            return [ this.firstVisit, this.lastVisit ]; //return data for next iteration lastSessionCheck
        }
    }
}

module.exports = Session;