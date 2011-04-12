var AutodafePart = require('autodafe_part');

module.exports = DbCommand.inherits( AutodafePart );

function DbCommand( params ) {
  this._init( params );
}


DbCommand.prototype._init = function( params ) {
  this.super_._init( params );

  var DbConnection = require('./db_connection');
  if ( !params || !( params.db_connection instanceof DbConnection ) )
    throw new Error( '`db_connection` is not instance of DbConnection in DbCommand.init' );

  this._.db_connection = params.db_connection;

  this.text         = params.text || '';

  this._params    = {};
  this._qm_params = [];
};


DbCommand.prototype.bind_values = function ( params ) {
  if ( !Object.isObject( params ) )
    throw new Error( "`params` should be instance of Object or Array in DbCommand.bind_values" );

  if ( Object.empty( params ) ) return this;
  this[ Array.isArray( params ) ? '_qm_params' : '_params' ] = Object.not_deep_clone( params );

  return this;
};


DbCommand.prototype.bind_value = function( name, value ) {
  if ( name == Number( name ) ) {
    this._qm_params[ name ] = value;
    return this;
  }

  this._params[ name ] = value;
  return this;
};


DbCommand.prototype.execute = function( callback ) {
  callback = typeof callback == "function" ? callback : function( e ) { throw e; }

  try {
    this._apply_params();
  }
  catch( e ) {
    callback( e );
  }

  this.db_connection.query( this.text, callback );
};


DbCommand.prototype._apply_params = function () {
  var i     = 0;
  var self  = this;

  this.text = this.text.replace( /\?/g, function(){
    return self.db_connection.quote_value( self._qm_params[ i++ ] );
  } );

  for ( var name in this._params ) {
    var true_name = name[0] == ':' ? name : ':' + name;
    this.text = this.text.replace( true_name, this.db_connection.quote_value( this._params[ name ] ) );
  }
};