module.exports = Json.inherits( global.autodafe.Controller );

function Json( params ){
  this._init( params );
}


Json.prototype._init = function( params ){
  Json.parent._init.call( this, params );

  this.views_folder = 'json';
  this.views_ext    = '.json';

  this.behavior_for( 'not_valid', this.validation_error );
}


Json.prototype.validation_error = function( response, request, errors ){
  response.send({
    errors : errors
  });
}