module.exports = Action.inherits( global.autodafe.Controller );


function Action( params ) {
  this._init( params );
}


Action.prototype.index = function ( response ) {
  response.send();
};


Action.prototype.line = function ( response, request ) {
  request.client.broadcast( 'line', request.params );
};