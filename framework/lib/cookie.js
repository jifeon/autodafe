exports.read = function( cookie, cookie_name ) {
  if ( typeof cookie != "string" || !cookie.length ) return "";

  var results = cookie.match( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );

  return results && results.length >= 3 ? unescape ( results[2] ) : null;
};