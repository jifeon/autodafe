var AppModule = require('app_module');

module.exports = DbCommand.inherits( AppModule );

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
  this._source_text     = this._text;
  this._params          = {};
  this._params_applied  = false;
};


DbCommand.prototype.reset = function () {
  this._text            = '';
  this._source_text     = '';
  this._params          = {};
  this._params_applied  = false;

  return this;
};


DbCommand.prototype.get_text = function ( as_is ) {
  if ( as_is ) return this._source_text;

  this._apply_params();
  return this._text;
};


DbCommand.prototype.set_text = function ( text ) {
  this._params_applied  = false;
  this._text            = text;
  this._source_text     = this._text;

  return this;
};


DbCommand.prototype.bind_values = function ( params ) {
  if ( !Object.isObject( params ) || Array.isArray( params ) ) {
    this.log( "`params` to `bind_values` should be instance of Object and not an Array", 'warning' );
    return this;
  }

  if ( Object.isEmpty( params ) ) return this;
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


DbCommand.prototype.query_scalar = function ( callback ) {
  this.execute( function( e, result ) {
    if ( e ) return callback( e );

    var success = false;
    result.fetch_array( function( row ) {
      callback( null, row[0] );

      success = true;
      return false;
    } );

    if ( !success ) callback( new Error( 'There are no expected result for DbCommand.query_scalar' ) );
  } );
};


DbCommand.prototype._apply_params = function () {
  if ( this._params_applied ) return;

  for ( var name in this._params ) {
    var true_name = name[0] == ':' ? name : ':' + name;
    this._text = this._text.replace( new RegExp( true_name + '(?=[^\\w\\d_]|$)', 'g' ), this.db_connection.quote_value( this._params[ name ] ) );
  }

  this._params_applied = true;
};