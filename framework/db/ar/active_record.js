var Model           = require('model');
var DbCriteria      = require('db/db_criteria');
var DbCommand       = require('db/db_command');
var AppModule       = require('app_module');
var Emitter         = process.EventEmitter;

module.exports = ActiveRecord.inherits( Model );

function ActiveRecord() {
  throw new Error( 'ActiveRecord is abstract class. You can\'t instantiate it!' );
}



ActiveRecord.prototype._init = function( params ) {
  this.super_._init( params );

  this._.table_name = this.constructor.table_name;

  if ( !this.table_name )
    throw new Error( 'You should specify `table_name` property for ' + this.class_name );

  this._.db_connection  = this.app.db;

  this._primary_key = null;

  this.is_new       = params.is_new == undefined ? true : params.is_new;
};


ActiveRecord.prototype.get_model = function () {
  return this;
};


ActiveRecord.prototype.get_table = function ( callback ) {
  this.db_connection.db_schema.get_table( this.table_name, callback );
};


ActiveRecord.prototype.get_primary_key = function ( table_schema ) {

  var result = [];

  table_schema.each_primary_key( function( pk ) {
    result.push( this[ pk ] );
  }, this );

  return result.length > 1 ? result : result[0] || null;
};


ActiveRecord.prototype.save = function( run_validation, attributes, callback ) {
  if ( run_validation == undefined ) run_validation = true;

    return this.is_new ? this.insert( attributes, callback ) : this.update( attributes, callback );
}


ActiveRecord.prototype.insert = function( attributes ) {
  this.log( 'insert' );

  if ( !this.is_new )
    throw new Error( 'The active record cannot be inserted to database because it is not new.' );

  var self = this;
  return this.__wrap_to_get_table( function( table, emitter ) {
    var builder = this.get_command_builder();
    var command = builder.create_insert_command( table, this.get_attributes( table, attributes ) );

    command.execute( function( e, result ) {
      if ( e ) return emitter.emit( 'error', e );

      if ( table.in_sequence ) table.each_primary_key( function( pk ) {

        if ( self[ pk ] == null ) {
          self[ pk ] = result.insert_id;
          return false;
        }
      } );

      self._primary_key = self.get_primary_key( table );
      self.is_new       = false;

      emitter.emit( 'success', result );
    });
  } );
}


ActiveRecord.prototype.update = function( attributes ) {
  this.log( 'update' );

  if ( this.is_new )
    throw new Error( 'The active record cannot be updated because it is new.' );

  var emitter = new Emitter;
  var self    = this;

  this.get_table( function( e, table ) {
    if ( e ) return emitter.emit( 'error', e );

    if ( self._primary_key == null )
      self._primary_key = self.get_primary_key( table );

    this.update_by_pk( this._primary_key, this.get_attributes( table, attributes ) )
      .on( 'error', function( e ) {
        emitter.emit( 'error', e );
      } )
      .on( 'success', function( result ) {
        self._primary_key = self.get_primary_key( table );
        emitter.emit( 'success', result );
      } );

  } );

  return emitter;
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

ActiveRecord.prototype.__re_emit = function ( source_emitter, destination_emitter ) {
  source_emitter
  .on( 'error', function( e ) {
    destination_emitter.emit( 'error', e );
  } )
  .on( 'success', function( result ) {
    destination_emitter.emit( 'success', result );
  } )
};


ActiveRecord.prototype.remove = function() {
  this.log( 'remove' );

  if ( this.is_new ) throw new Error( 'the active record cannot be deleted because it is new.' );

  var emitter = new Emitter;
  var self    = this;

  this.get_table( function( e, table ) {
    if ( e ) return emitter.emit( 'error', e );

    self.__re_emit( self.remove_by_pk( self.get_primary_key( table ) ), emitter );
  } );

  return emitter;
}


ActiveRecord.prototype.refresh = function() {
  this.log( 'refresh' );

  var emitter = new Emitter;

  if ( this.is_new ) {
    process.nextTick( function() {
      emitter.emit( 'success' );
    } );
    return emitter;
  }

  var self = this;

  this.get_table( function( e, table ) {
    if ( e ) emitter.emit( 'error', e );

    this.find_by_pk( this.get_primary_key( table ) )
      .on( 'error', function( e ) {
        emitter.emit( 'error', e );
      } )
      .on( 'success', function( record ) {
        if ( !record ) return emitter.emit( 'error', new Error( 'Can\'t find reflection of record in data base' ) );

        self.clean_attributes();
        table.get_column_names().forEach( function( name ) {
          self.set_attribute( name, record[ name ] );
        } );

        emitter.emit( 'success' );
      } );
  } );

  return emitter;
}


ActiveRecord.prototype.set_primary_key = function( value ) {
  this._primary_key = value;
}


ActiveRecord.prototype.primary_key = function () {
  return 'id';
};


ActiveRecord.prototype.get_command_builder = function () {
  return this.db_connection.db_schema.command_builder;
};


ActiveRecord.prototype.query = function ( criteria, all ) {
  var emitter = new Emitter;
  all         = all || false;

  if( !all ) criteria.limit = 1;

  var self = this;

  this.get_table( function( e, table ){
    if ( e ) return emitter.emit( 'error', e );

    var command = self.get_command_builder().create_find_command( table, criteria );

    command.execute( function( e, result ) {
      if ( e ) return emitter.emit( 'error', e );

      var res = [];

      result.fetch_obj( function( obj ) {
        res.push( self.populate_record( obj ) );
  
        if ( !all ) return false;
      } );

      emitter.emit( 'success', all ? res : res[0] || null );
    } );
  } );

  return emitter;
};


ActiveRecord.prototype.populate_record = function( attributes ) {
  if ( !attributes ) return null;

  var record  = this.instantiate( attributes );

  for ( var name in attributes ) {
    record[ name ] = attributes[ name ];
  }

  return record;
};


ActiveRecord.prototype.instantiate = function () {
  return new this.constructor({
    is_new  : false,
    app     : this.app
  });
};


ActiveRecord.prototype.get_table_alias = function() {
  return this.db_connection.db_schema.quote_table_name( 't' );
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

  return this.__wrap_to_get_table( function( table ) {
    var prefix    = this.get_table_alias() + '.';
    var criteria  = this.get_command_builder().create_pk_criteria( table, pk, condition, params, prefix );

    return this.query( criteria );
  });
};


ActiveRecord.prototype.find_all_by_pk = function( pk, condition, params ) {
  this.log( 'find_all_by_pk' );

  return this.__wrap_to_get_table( function( table ) {
    var prefix    = this.get_table_alias() + '.';
    var criteria  = this.get_command_builder().create_pk_criteria( table, pk, condition, params, prefix );

    return this.query( criteria, true );
  } );
}


ActiveRecord.prototype.__wrap_to_get_table = function ( fun ) {
  var emitter = new Emitter;
  var self    = this;

  this.get_table( function( e, table ) {
    if ( e ) return emitter.emit( 'error', e );

    var res = fun.call( self, table, emitter );
    if ( res instanceof Emitter ) self.__re_emit( res, emitter );
    else if ( res instanceof DbCommand ) self.__execute_command( res, emitter );
  });

  return emitter;
};


ActiveRecord.prototype.__execute_command = function ( command, emitter ) {
  command.execute( function( e, result ) {
    emitter.emit( e ? 'error' : 'success', e || result );
  } );
};



ActiveRecord.prototype.find_by_attributes = function( attributes, condition, params ) {
  this.log( 'find_by_attributes' );

  return this.__wrap_to_get_table( function( table ) {
    var prefix    = this.get_table_alias() + '.';
    var criteria  = this.get_command_builder().create_column_criteria( table, attributes, condition, params, prefix );

    return this.query( criteria );
  } );
}


ActiveRecord.prototype.find_all_by_attributes = function( attributes, condition, params ) {
  this.log( 'find_all_by_attributes' );

  return this.__wrap_to_get_table( function( table ) {
    var prefix    = this.get_table_alias() + '.';
    var criteria  = this.get_command_builder().create_column_criteria( table, attributes, condition, params, prefix );

    return this.query( criteria, true );
  });
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

    emitter.emit( 'success', record );
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

    emitter.emit( 'success', records );
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


ActiveRecord.prototype.update_by_pk = function( pk, attributes, condition, params ) {
  this.log( 'update_by_pk' );

  return this.__wrap_to_get_table( function( table ) {
    var builder   = this.get_command_builder();
    var criteria  = builder.create_pk_criteria( table, pk, condition, params );

    return builder.create_update_command( table, attributes, criteria );
  } );
}


ActiveRecord.prototype.update_all = function( attributes, condition, params, callback ) {
  this.log( 'update_all' );

  return this.__wrap_to_get_table( function( table ) {
    var builder   = this.get_command_builder();
    var criteria  = builder.create_criteria( condition, params );

    return builder.create_update_command( table, attributes, criteria );
  } );
}


ActiveRecord.prototype.update_counters = function( counters, condition, params, callback ) {
  this.log( 'update_counters' );

  return this.__wrap_to_get_table( function( table ) {
    var builder   = this.get_command_builder();
    var criteria  = builder.create_criteria( condition, params );

    return builder.create_update_counter_command( table, counters, criteria );
  } );
}


ActiveRecord.prototype.remove_by_pk = function( pk, condition, params ) {
  this.log( 'remove_by_pk' );

  return this.__wrap_to_get_table( function( table ) {
    var builder   = this.get_command_builder();
    var criteria  = builder.create_pk_criteria( table, pk, condition, params );

    return builder.create_delete_command( table, criteria );
  } );
}


ActiveRecord.prototype.delete_all = function( condition, params, callback ) {
  this.log( 'delete_all' );

  return this.__wrap_to_get_table( function( table ) {
    var builder   = this.get_command_builder();
    var criteria  = builder.create_criteria( condition, params );

    return builder.create_delete_command( table, criteria );
  });
}


ActiveRecord.prototype.delete_all_by_attributes = function( attributes, condition, params, callback ) {
  this.log( 'delete_all_by_attributes' );

  return this.__wrap_to_get_table( function( table ) {

    var builder   = this.get_command_builder();
    var criteria  = builder.create_column_criteria( table, attributes, condition, params );

    return builder.create_delete_command( table, criteria );
  });
}


//ActiveRecord.prototype.offset_exists = function( offset ) {
//  return isset( this.get_meta_data().columns[offset] );
//}