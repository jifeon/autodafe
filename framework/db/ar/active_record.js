var Model           = require('model');
var DbCriteria      = require('../../db/db_criteria');
var MetaData        = require('./active_record_meta_data');
var AppModule       = require('app_module');

module.exports = ActiveRecord.inherits( Model );

function ActiveRecord() {
  throw new Error( 'ActiveRecord is abstract class. You can\'t instantiate it!' );
}


ActiveRecord.models = {};


ActiveRecord.model = function( clazz, app ) {
  if ( typeof clazz != 'function' ) throw new Error( 'Class must be a function in ActiveRecord.model' );

  var table_name = clazz.get_table_name();

  if ( this.models[ table_name ] ) return this.models[ table_name ];

  return this.models[ table_name ] = new clazz({
    clazz : clazz,
    app   : app
  });
}


ActiveRecord.prototype._init = function( params ) {
  this.super_._init( params );

  this.clazz        = params.clazz || this.constructor;
  this.table        = this.clazz.get_table_name();
  this.db           = this.app.db;

  this._md          = new MetaData({
    model : this
  });
  this._attributes  = {};
  this._pk          = null;
  this._new         = params._new == undefined ? false : params._new;

  this.__c          = null;
};


ActiveRecord.prototype.get_model = function () {
  return this.app.model( this.clazz );
};


ActiveRecord.prototype.get_primary_key = function () {
  var table = this.get_model().get_meta_data().table_schema;
  
  if( typeof table.primary_key == 'string' )
    return this[ table.primary_key ];

  else if( table.primary_key instanceof Object ) {
    var values = {};

    for ( var name in table.primary_key )
      values[ name ] = this[ name ];

    return values;
  }
  else
    return null;
};


ActiveRecord.prototype.save = function( run_validation, attributes, callback ) {
  if ( run_validation == undefined ) run_validation = true;

    return this.get_is_new_record() ? this.insert( attributes, callback ) : this.update( attributes, callback );
}


ActiveRecord.prototype.get_is_new_record = function() {
  return this._new;
}


ActiveRecord.prototype.set_is_new_record = function( value ) {
  this._new = value;
}


ActiveRecord.prototype.insert = function( attributes ) {
  if ( !this.get_is_new_record() )
    throw new Error( 'The active record cannot be inserted to database because it is not new.' );

  this.log( 'insert' );

  var builder = this.get_command_builder();
  var table   = this.get_meta_data().table_schema;

  var command = builder.create_insert_command( table, this.get_attributes( attributes ) );
  var emitter = new process.EventEmitter;

  var self = this;

  command.execute( function( e, result ) {

    if ( !result ) return false;

    var primary_key = table.primary_key;
    if ( table.in_sequence ) {

      if ( typeof primary_key == "string" && self[ primary_key ] == null )
        self[ primary_key ] = result.insertId;

      else if ( primary_key instanceof Array ) {

        for ( var i = 0, i_ln = primary_key.length; i < i_ln; i++ ) {
          var pk = primary_key[i];

          if ( !self[ pk ] ) {
            self[ pk ] = result.insertId;
            break;
          }
        }

      }
    }

    self._pk = self.get_primary_key();
//    this.after_save();
    self.set_is_new_record( false );
    emitter.emit( 'complete', result );

  } );

  return emitter;
}


ActiveRecord.prototype.update = function( attributes, callback ) {
  if ( this.get_is_new_record() )
    throw new Error( 'the active record cannot be updated because it is new.' );

  this.log( 'update' );

  if ( this._pk == null )
    this._pk = this.get_primary_key();
  var self = this;

  this.update_by_pk(
    this.get_old_primary_key(), this.get_attributes( attributes ), undefined, undefined,
    function( e, result ) {
      self._pk = self.get_primary_key();
      callback( null, result );
    }
  );
}


//ActiveRecord.prototype.save_attributes = function( attributes ) {
//  if ( !this.get_isnew_record() ) {
//    yii::trace( get_class( this ).
//    '.save_attributes()','system.db.ar.cactive_record'
//  )
//    ;
//    values = array();
//    foreach( attributes
//    as
//    name =
//  >
//    value
//  )
//    {
//      if ( is_integer( name ) )
//        values[value] = this.value;
//      else
//        values[name] = this.name = value;
//    }
//    if ( this._pk === null )
//      this._pk = this.get_primary_key();
//    if ( this.update_bypk( this.get_old_primary_key(), values ) > 0 ) {
//      this._pk = this.get_primary_key();
//      return true;
//    }
//    else
//      return false;
//  }
//  else
//    throw new cdb_exception( yii::t( 'yii', 'the active record cannot be updated because it is new.' ) );
//}
//

ActiveRecord.prototype.remove = function() {
  if ( this.get_is_new_record() ) throw new Error( 'the active record cannot be deleted because it is new.' );

  this.log( 'remove' );

  return this.delete_by_pk( this.get_primary_key() );
}


ActiveRecord.prototype.refresh = function() {
  this.log( 'refresh' );

  var emitter = new process.EventEmitter;

  if ( this.get_is_new_record() ) {
    process.nextTick( function() {
      emitter.emit( 'complete' );
    } );
    return emitter;
  }

  var self = this;
  this.find_by_pk( this.get_primary_key() ).on( 'complete', function( record ) {
    if ( !record ) return emitter.emit('complete');

    self._attributes = {};
    for ( var name in self.get_meta_data().columns ) {
      if ( typeof self[ name ] != 'undefined' ) self[ name ] = record[ name ];
      else self._attributes[ name ] = record[ name ];
    }

    emitter.emit( 'complete' );
  } );

  return emitter;
}


ActiveRecord.prototype.equals = function( record ) {
  return this.table_name() === record.table_name() && this.get_primary_key() === record.get_primary_key();
}


ActiveRecord.prototype.set_primary_key = function( value ) {
  this._pk  = this.get_primary_key();
  var table = this.get_meta_data().table_schema;

  if ( typeof table.primary_key == "string" )
    this[ table.primary_key ] = value;

  else if ( Array.isArray( table.primary_key ) )
    for ( var name in table.primary_key )
      this[ name ] = value[ name ];
}


ActiveRecord.prototype.get_old_primary_key = function() {
  return this._pk;
};


ActiveRecord.prototype.table_name = function () {
  return this.table;
};


ActiveRecord.prototype.primary_key = function () {
  return 'id';
};


ActiveRecord.prototype.get_command_builder = function () {
  return this.db.db_schema.command_builder;
};


ActiveRecord.prototype.get_db_connection = function () {
  return this.db;
};


ActiveRecord.prototype.get_meta_data = function () {
  return this._md;
};


ActiveRecord.prototype.query = function ( criteria, all ) {
  var self = this;

  var emitter = new process.EventEmitter;

  this.get_table_schema( function() {
    self.query = self.__query;
    self.query( criteria, all, emitter );
  } );

  return emitter;
};


ActiveRecord.prototype.__query = function ( criteria, all, emitter ) {
  emitter   = emitter || new process.EventEmitter
  all       = all     || false;

  criteria  = this.apply_scopes( criteria );

  if( !all ) criteria.limit = 1;

  var self = this;
  var command = this.get_command_builder().create_find_command( this.get_table_schema(), criteria );

  command.execute( function( e, result ) {
    var res = [];

    result.fetch_obj( function( obj ) {
      var record = self.populate_record( obj );

      res.push( record );

      if ( !all ) return false;
    } );

    emitter.emit( 'complete', all ? res : res[0] || null );
  } );

  return emitter;
};


ActiveRecord.prototype.get_safe_attribute_names = function () {
  return {};
};


ActiveRecord.prototype.apply_scopes = function( criteria ) {
  var c = this.get_db_criteria( false );

  if( c !== null ) {
    c.merge_with( criteria );
    criteria = c;
    this.__c = null;
  }

  return criteria;
};


ActiveRecord.prototype.get_db_criteria = function ( create_if_null ) {
  if ( create_if_null == undefined ) create_if_null = true;

  if ( this.__c == null ) {
    var c = this.default_scope();

    if( !Object.empty( c ) || create_if_null )
      this.__c = new DbCriteria( c );
  }

  return this.__c;
};


ActiveRecord.prototype.default_scope = function () {
  return [];
};


ActiveRecord.prototype.get_table_schema = function ( callback ) {
  callback = callback || function(){};
  var md = this.get_meta_data();

  if ( md.initialized ) callback( md.table_schema );
  else md.on( 'initialized', function() { callback( md.table_schema ) } );

  return md.table_schema;
};


ActiveRecord.prototype.get_active_relation = function( name ) {
  var r = this.get_meta_data().relations[ name ];
  return r || null;
}


ActiveRecord.prototype.get_attributes = function( names ) {
  if ( names == undefined ) names = true;

  var attributes  = this._attributes;
  var columns     = this.get_meta_data().columns;

  for ( var name in columns ) {

    if ( typeof this[ name ] != "undefined" ) attributes[name] = this[ name ];
    else if ( names === true && attributes[ name ] == undefined )
      attributes[ name ] = null;
  }

  if ( names instanceof Array ) {
    var attrs = {};

    for ( var n = 0, n_ln = names.length; n < n_ln; n++ ) {
      attrs[ name ] = attributes[name] != undefined ? attributes[ name ] : null;
    }

    return attrs;
  }

  return attributes;
};


ActiveRecord.prototype.set_attributes = function ( values, safe_only ) {
  if ( safe_only == undefined ) safe_only = true;

  if ( !( values instanceof Object ) || values === null ) return false;

  var self = this;
//  var emitter = new process.EventEmitter;

  this.get_table_schema( function( table ){
    var pk = table.primary_key;

    for ( var name in values ) {
      var value = values[ name ];
      if ( table.get_column( name ) ){
        if( pk instanceof Object ){
          if( !pk[ name ] ) {
            self[ name ] = value;
          }
        } else {
          if( pk != name ){
            self[ name ] = value;
          }
        }
        /*if( safe_only ) */self._attributes[ name ] = value;
      }
      else self.log( 'ActiveRecord.set_attributes try to set unsafe parameter "%s"'.format( name ), 'warning' );
    }
    //emitter.emit( 'set' );
  });
//  return emitter;
};


ActiveRecord.prototype.populate_record = function( attributes ) {
  if ( !attributes ) return null;

  var record  = this.instantiate( attributes );
  var md      = record.get_model().get_meta_data();

  for ( var name in attributes ) {
    record[ name ] = attributes[ name ];
  }

  record._pk = record.get_primary_key();
  return record;
};


ActiveRecord.prototype.instantiate = function () {
  return new this.clazz({
    _new : false,
    app  : this.app
  });
};


ActiveRecord.prototype.get_table_alias = function( quote ) {
  var criteria  = this.get_db_criteria( false );

  var alias = criteria != null && criteria.alias != '' ? criteria.alias : 't';

  return quote ? this.get_db_connection().db_schema.quote_table_name( alias ) : alias;
}


ActiveRecord.prototype.find = function ( condition, params ) {
  this.log( 'find' );

  var criteria = this.get_command_builder().create_criteria( condition, params );

  return this.query( criteria );
};


ActiveRecord.prototype.find_all = function( condition, params ) {
  this.log( 'find_all' );

  var criteria = this.get_command_builder().create_criteria( condition, params );

  return this.query( criteria, true );
};


ActiveRecord.prototype.find_by_pk = function( pk, condition, params ) {
  this.log( 'find_by_pk' );

  var prefix    = this.get_table_alias( true ) + '.';
  var criteria  = this.get_command_builder().create_pk_criteria( this.get_table_schema(), pk, condition, params, prefix );

  return this.query( criteria );
};


ActiveRecord.prototype.find_all_by_pk = function( pk, condition, params ) {
  this.log( 'find_all_by_pk' );

  var prefix = this.get_table_alias( true ) + '.';
  var criteria = this.get_command_builder().create_pk_criteria( this.get_table_schema(), pk, condition, params, prefix );

  return this.query( criteria, true );
}


ActiveRecord.prototype.find_by_attributes = function( attributes, condition, params ) {
  this.log( 'find_by_attributes' );

  var prefix = this.get_table_alias( true ) + '.';
  var criteria = this.get_command_builder()
                     .create_column_criteria( this.get_table_schema(), attributes, condition, params, prefix );

  return this.query( criteria );
}


ActiveRecord.prototype.find_all_by_attributes = function( attributes, condition, params ) {
  this.log( 'find_all_by_attributes' );

  var prefix = this.get_table_alias( true ) + '.';
  var criteria = this.get_command_builder().create_column_criteria( this.get_table_schema(), attributes, condition, params, prefix );

  return this.query( criteria, true );
}


ActiveRecord.prototype.find_by_sql = function( sql, params ) {
  this.log( 'find_by_sql' );

  var command = this.get_command_builder().create_sql_command( sql, params );
  var emitter = new process.EventEmitter;
  var self = this;

  command.execute( function( e, result ) {
    var record;
    result.fetch_obj( function( obj ) {
      record = self.populate_record( obj );
      return false;
    } );

    emitter.emit( 'complete', record );
  } );

  return emitter;
}


ActiveRecord.prototype.find_all_by_sql = function( sql, params ) {
  this.log( 'find_all_by_sql' );

  var command = this.get_command_builder().create_sql_command( sql, params );
  var emitter = new process.EventEmitter;
  var self = this;

  command.execute( function( e, result ) {
    var records = [];
    result.fetch_obj( function( obj ) {
      records.push( self.populate_record( obj ) );
    }  );

    emitter.emit( 'complete', records );
  } );
  return emitter;
}

// todo: count

//ActiveRecord.prototype.count = function( condition, params ) {
//  var builder   = this.get_command_builder();
//  var criteria  = builder.create_criteria( condition, params );
//
//  this.apply_scopes( criteria );
//
////  if ( empty( criteria.with ) )
//  return builder.create_count_command( this.get_table_schema(), criteria ).query_scalar();
////else
////  return this.
////  with ( criteria.with ).
////  count( criteria );
//}


//ActiveRecord.prototype.count_by_sql = function( sql, params = array() ) {
//  yii::trace( get_class( this ).
//  '.count_bysql()','system.db.ar.cactive_record'
//)
//  ;
//  return this.get_command_builder().create_sql_command( sql, params ).query_scalar();
//}


//ActiveRecord.prototype.exists = function( condition, params = array() ) {
//  yii::trace( get_class( this ).
//  '.exists()','system.db.ar.cactive_record'
//)
//  ;
//  builder = this.get_command_builder();
//  criteria = builder.create_criteria( condition, params );
//  table = this.get_table_schema();
//  criteria.select = reset( table.columns ).raw_name;
//  criteria.limit = 1;
//  this.apply_scopes( criteria );
//  return builder.create_find_command( table, criteria ).query_row() !== false;
//}


ActiveRecord.prototype.update_by_pk = function( pk, attributes, condition, params, callback ) {
  this.log( 'update_by_pk' );

  var builder   = this.get_command_builder();
  var table     = this.get_table_schema();
  var criteria  = builder.create_pk_criteria( table, pk, condition, params );
  var command   = builder.create_update_command( table, attributes, criteria );
  return command.execute( callback );
}


ActiveRecord.prototype.update_all = function( attributes, condition, params, callback ) {
  this.log( 'update_all' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_criteria( condition, params );
  var command   = builder.create_update_command( this.get_table_schema(), attributes, criteria );
  return command.execute( callback );
}


ActiveRecord.prototype.update_counters = function( counters, condition, params, callback ) {
  this.log( 'update_counters' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_criteria( condition, params );
  var command   = builder.create_update_counter_command( this.get_table_schema(), counters, criteria );
  return command.execute( callback );
}


ActiveRecord.prototype.delete_by_pk = function( pk, condition, params, callback ) {
  this.log( 'delete_by_pk' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_pk_criteria( this.get_table_schema(), pk, condition, params );
  var command   = builder.create_delete_command( this.get_table_schema(), criteria );
  return command.execute( callback );
}


ActiveRecord.prototype.delete_all = function( condition, params, callback ) {
  this.log( 'delete_all' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_criteria( condition, params );
  var command   = builder.create_delete_command( this.get_table_schema(), criteria );
  return command.execute( callback );
}


ActiveRecord.prototype.delete_all_by_attributes = function( attributes, condition, params, callback ) {
  this.log( 'delete_all_by_attributes' );

  var builder   = this.get_command_builder();
  var table     = this.get_table_schema();
  var criteria  = builder.create_column_criteria( table, attributes, condition, params );
  var command   = builder.create_delete_command( table, criteria );
  return command.execute( callback );
}


//ActiveRecord.prototype.offset_exists = function( offset ) {
//  return isset( this.get_meta_data().columns[offset] );
//}