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

  this._text            = params.text || '';
  this._params          = {};
  this._params_applied  = false;
};


DbCommand.prototype.reset = function () {
  this._text            = '';
  this._params          = {};
  this._params_applied  = false;

  return this;
};


DbCommand.prototype.get_text = function () {
  this._apply_params();
  return this._text;
};


DbCommand.prototype.set_text = function ( text ) {
  this._params_applied  = false;
  this._text            = text;

  return this;
};


DbCommand.prototype.bind_values = function ( params ) {
  if ( !Object.isObject( params ) || Array.isArray( params ) )
    throw new Error( "DbCommand.bind_values: `params` should be instance of Object and not an Array" );

  if ( Object.empty( params ) ) return this;
  this._params         = Object.not_deep_clone( params );
  this._params_applied = false;

  return this;
};


DbCommand.prototype.bind_value = function( name, value ) {
  this._params[ name ] = value;
  this._params_applied = false;
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

  this.db_connection.query( this._text, callback );
  return this;
};


DbCommand.prototype._apply_params = function () {
  if ( this._params_applied ) return;

  for ( var name in this._params ) {
    var true_name = name[0] == ':' ? name : ':' + name;
    this._text = this._text.replace( true_name, this.db_connection.quote_value( this._params[ name ] ) );
  }

  this._params_applied = true;
};