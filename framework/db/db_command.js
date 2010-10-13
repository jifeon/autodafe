var DBCommand = module.exports = function( params ) {
  this._init( params );
};


DBCommand.prototype._init = function( params ) {
  this.__connection = params.connection;
  this.__text       = '';

  this.set_text( params.text );
//  this.__statement  = null;
  this.__params     = {};
  this.__qm_params  = [];

  this.__get_last_insert_id_on_success = false;
};


DBCommand.prototype.get_text = function() {
  return this.__text;
};


DBCommand.prototype.set_text = function( value ) {
//  if ( this._connection.table_prefix !== null )
//    this._text = value.replace( /{{(+*?)}}/ ); preg_replace( '/{{(+*?)}}/', this._connection.table_prefix + '\1', value );
//  else
  // todo: prefix

  this.__text = value;
//  this.cancel();
}


DBCommand.prototype.get_connection = function() {
  return this._connection;
}


DBCommand.prototype.bind_value = function( name, value ) {
  if ( name == Number( name ) ) {
    this.__qm_params[ name ] = value;
    return this;
  }

  this.__params[ name ] = value;
  return this;
};


DBCommand.prototype.execute = function( callback ) {
  this.__apply_params();

  var emitter     = new process.EventEmitter;
  var db_command  = this;

  var query_emitter = this.__connection.query( this.__text, function( result ) {
    var db = this;

    if ( db_command.__get_last_insert_id_on_success && result && result.SUCCESS ) {

      db_command.__connection.query( 'SELECT LAST_INSERT_ID()', function( insert_id ) {
        this.fetch_obj( insert_id, function( obj ) {
          result.last_insert_id = obj[ 'LAST_INSERT_ID()' ];

          query_emitter.on( 'response', function() {
            emitter.emit( 'complete', result, db );
          } );
          if ( typeof callback == "function" ) callback.call( db, result );
          return false;
        } );
      } );
    }
    else {

      query_emitter.on( 'response', function() {
        emitter.emit( 'complete', result, db );
      } );
      if ( typeof callback == "function" ) callback.call( db, result );
    }
  });

  return emitter;
};


DBCommand.prototype.__apply_params = function () {
  var i = 0;
  var self = this;

  this.__text = this.__text.replace( /\?/g, function(){
    return self.__connection.quote_value( self.__qm_params[ i++ ] );
  } );

  for ( var name in this.__params ) {
    this.__text = this.__text.replace( name, this.__connection.quote_value( this.__params[ name ] ) );
  }
};


DBCommand.prototype.get_last_insert_id_on_success = function ( value ) {
  this.__get_last_insert_id_on_success = value;
};


DBCommand.prototype.need_get_last_insert_id = function () {
  return this.__get_last_insert_id_on_success;
};