var http              = require('http');
var server = http.createServer( function( req, res ) {
  console.log( 'client request' );
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
} );
server.listen( 8080 );
console.log( 'server is ready' );