exports.read = function( cookie, cookie_name ) {
  if ( typeof cookie != "string" || !cookie.length ) return "";

  var results = cookie.match( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );

  return results && results.length >= 3 ? unescape ( results[2] ) : null;
};


exports.make = function( name, value, days ) {
  var expires = "";

  if ( days ) {
    var date = new Date();
    date.setTime( date.getTime() + ( days * 24 * 60 * 60 * 1000 ));
    expires = "; expires="+date.toGMTString();
  }

  return name + "=" + value + expires + "; path=/";
}