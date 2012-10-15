module.exports = Json.inherits( global.autodafe.Controller );

function Json( params ){
  this._init( params );
}


Json.prototype._init = function( params ){
  Json.parent._init.call( this, params );

  this.views_folder = 'json';
  this.views_ext    = '.json';
}