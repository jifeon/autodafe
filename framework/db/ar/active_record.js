var Model             = require('model');
var DbCommand         = require('db/db_command');
var Emitter           = process.EventEmitter;
var ActiveFinder      = require('./active_finder');
var tools             = require( 'lib/tools' );
var active_relations  = {
  belongs_to  : require('./relations/belongs_to_relation'),
  stat        : require('./relations/stat_relation'),
  has_one     : require('./relations/has_one_relation'),
  has_many    : require('./relations/has_many_relation'),
  many_many   : require('./relations/many_many_relation')
};

module.exports = ActiveRecord.inherits( Model );

function ActiveRecord() {
  throw new Error( 'ActiveRecord is abstract class. You can\'t instantiate it!' );
}


ActiveRecord._relations = null;


ActiveRecord.prototype._init = function( params ) {
  this.super_._init( params );

  this._.table_name = this.constructor.table_name;

  if ( !this.table_name )
    throw new Error( 'You should specify `table_name` property for ' + this.class_name );

  this._.db_connection  = this.app.db;

  this._related         = {};
  this._alias           = 't';

  this._init_relations();
};


ActiveRecord.prototype._init_relations = function () {
  if ( this.get_relations() ) return;

  this.constructor._relations = {};
  var relations = this.relations();

  for ( var relation_name in relations ) {
    var params        = relations[ relation_name ];
    var relation_type = params.type;

    delete params.type;

    params.name  = relation_name;
    params.model = this;
    params.app   = this.app;

    this.constructor._relations[ relation_name ] = new active_relations[ relation_type ]( params );
  }

};


ActiveRecord.prototype.get_attribute = function ( name ) {
  return this._related[ name ] || this.super_.get_attribute( name );
};


ActiveRecord.prototype.relations = function () {
  return {};
};


ActiveRecord.prototype.get_relations = function () {
  return this.constructor._relations;
};


ActiveRecord.prototype.get_related = function ( name, refresh, params ) {
  refresh = refresh || false;
  params  = params  || {};

  var relations = this.get_relations();

  if ( !relations[ name ] ) throw new Error(
    '%s does not have relation `%s`'.format( this.class_name, name )
  );

  if ( this._related[ name ] && !refresh && Object.isEmpty( params ) )
    return tools.next_tick( this._related[ name ] );

  this.log( 'Load relation `%s`'.format( name ), 'trace' );

  var relation        = relations[ name ];
  if ( this.is_new && ( relation.class_name == 'HasOneRelation' || relation.class_name == 'HasManyRelation' ) )
    return relation.class_name == 'HasOneRelation' ? null : [];

  var saved_relation  = null;
  var With = {};
  if ( !Object.isEmpty( params ) ) {
    saved_relation = this._related[ name ] || null;
    With = name;
  }
  else With[ name ] = params;

  delete this._related[ name ];

  var finder = new ActiveFinder({
    app   : this.app,
    model : this,
    With  : With
  });
  finder.lazy_find( this );


//  $finder->lazyFind($this);
//
//		if(!isset($this->_related[$name]))
//		{
//			if($relation instanceof CHasManyRelation)
//				$this->_related[$name]=array();
//			else if($relation instanceof CStatRelation)
//				$this->_related[$name]=$relation->defaultValue;
//			else
//				$this->_related[$name]=null;
//		}
//
//		if($params!==array())
//		{
//			$results=$this->_related[$name];
//			if($exists)
//				$this->_related[$name]=$save;
//			else
//				unset($this->_related[$name]);
//			return $results;
//		}
//		else
//			return $this->_related[$name];
};


ActiveRecord.prototype._create_relation = function ( type ) {
  var self = this;

  return {
    by : function( foreign_key, options ) {
      return {
        type        : type,
        foreign_key : foreign_key,
        options     : options || {}
      };
    }
  }
};


ActiveRecord.prototype.belongs_to = function () {
  return this._create_relation( 'belongs_to' );
};


ActiveRecord.prototype.has_one = function () {
  return this._create_relation( 'has_one' );
};


ActiveRecord.prototype.has_many = function () {
  return this._create_relation( 'has_many' );
};


ActiveRecord.prototype.many_many = function () {
  return this._create_relation( 'many_many' );
};


ActiveRecord.prototype.stat = function () {
  return this._create_relation( 'stat' );
};


ActiveRecord.prototype.get_table = function ( callback ) {
  this.db_connection.db_schema.get_table( this.table_name, callback );
};


ActiveRecord.prototype.get_attributes = function( table, names ) {
  var attributes = Object.not_deep_clone( this._attributes );

  table.get_column_names().forEach( function( column_name ) {

    if ( this.hasOwnProperty( column_name ) )
      attributes[ column_name ] = this[ column_name ];

    if ( attributes[ column_name ] == undefined )
      attributes[ column_name ] = null;

  }, this );


  if ( names instanceof Array ) {

    var attrs = {};

    names.forEach( function( name ){
      attrs[ name ] = attributes[ name ] != undefined ? attributes[ name ] : null;
    });

    return attrs;
  }

  return attributes;
};


ActiveRecord.prototype.__wrap_to_get_table = function ( fun, option ) {
  var emitter = new Emitter;
  var self    = this;

  this.get_table( function( e, table ) {
    if ( e ) return emitter.emit( 'error', e );

    var res = fun.call( self, table, emitter );

    if ( res instanceof DbCommand ) self.__execute_command( res, emitter, option );
    else if ( res instanceof Emitter ) self.__re_emit( res, emitter );
  });

  return emitter;
};


ActiveRecord.prototype.__execute_command = function ( command, emitter, option ) {
  command[ option == 'scalar' ? 'query_scalar' : 'execute' ]( function( e, result ) {
    emitter.emit( e ? 'error' : 'success', e || result );
  } );
};


ActiveRecord.prototype.__re_emit = function ( source_emitter, destination_emitter ) {
  source_emitter
  .on( 'error', function( e ) {
    destination_emitter.emit( 'error', e );
  } )
  .on( 'success', function( result ) {
    destination_emitter.emit( 'success', result );
  } )
};


ActiveRecord.prototype.get_command_builder = function () {
  return this.db_connection.db_schema.command_builder;
};


ActiveRecord.prototype.get_table_alias = function( quote ) {
  return quote ? this.db_connection.db_schema.quote_table_name( this._alias ) : this._alias;
}


ActiveRecord.prototype.set_table_alias = function ( alias ) {
  this._alias = alias;
};


ActiveRecord.prototype.get_primary_key = function ( table_schema ) {

  var result = [];

  table_schema.each_primary_key( function( pk ) {
    result.push( this.get_attribute( pk ) );
  }, this );

  return result.length > 1 ? result : result[0] || null;
};


ActiveRecord.prototype.set_primary_key = function( table_schema, primary_key ) {
  if ( Array.isArray( table_schema.primary_key ) )
    table_schema.each_primary_key( function( key ) {
      this.set_attribute( key, primary_key[ key ] );
    }, this );

  else this.set_attribute( table_schema.primary_key, primary_key );
}


ActiveRecord.prototype.save = function( attributes ) {
  return this.is_new ? this.insert( attributes ) : this.update( attributes );
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

      self._.is_new = false;

      emitter.emit( 'success', result );
    });
  } );
}


ActiveRecord.prototype.update = function( attributes ) {
  this.log( 'update' );

  if ( this.is_new )
    throw new Error( 'The active record cannot be updated because it is new.' );

  return this.__wrap_to_get_table( function( table ) {
    return this.update_by_pk( this.get_primary_key( table ), this.get_attributes( table, attributes ) )
  } );
}


ActiveRecord.prototype.remove = function() {
  this.log( 'remove' );

  if ( this.is_new ) throw new Error( 'The active record cannot be deleted because it is new.' );

  return this.__wrap_to_get_table( function( table ) {
    return this.remove_by_pk( this.get_primary_key( table ) )
  } );
}


ActiveRecord.prototype.refresh = function() {
  this.log( 'refresh' );

  if ( this.is_new ) throw new Error( 'The active record cannot be refreshed because it is new.' );


  return this.__wrap_to_get_table( function( table, emitter ) {
    var self = this;

    this.find_by_pk( this.get_primary_key( table ) )
      .on( 'error', function( e ) {
        emitter.emit( 'error', e );
      } )
      .on( 'success', function( record ) {
        if ( !record ) return emitter.emit( 'error', new Error( 'Can\'t find reflection of record in data base' ) );

        self._clean_attributes();
        table.get_column_names().forEach( function( name ) {
          self.set_attribute( name, record[ name ] );
        } );

        emitter.emit( 'success' );
      } );
  } );
}


ActiveRecord.prototype.query = function ( criteria, all ) {
  all = all || false;
  if( !all ) criteria.limit = 1;

  return this.__wrap_to_get_table( function( table, emitter ) {
    var command = this.get_command_builder().create_find_command( table, criteria );
    var self    = this;

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
};


ActiveRecord.prototype.populate_record = function( attributes ) {
  if ( !attributes ) return null;

  var record = this.instantiate();

  for ( var name in attributes ) {
    record[ name ] = attributes[ name ];
  }

  return record;
};


ActiveRecord.prototype.instantiate = function () {
  return new this.app.models.get_model( this.constructor, {
    is_new : false
  } );
};


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
    if ( e ) return emitter.emit( 'error', e );

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
    if ( e ) return emitter.emit( 'error', e );
    
    var records = [];
    result.fetch_obj( function( obj ) {
      records.push( self.populate_record( obj ) );
    }  );

    emitter.emit( 'success', records );
  } );
  return emitter;
}

ActiveRecord.prototype.count = function( condition, params ) {
  this.log( 'count' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_criteria( condition, params );

  return this.__wrap_to_get_table( function( table ) {
    return builder.create_count_command( table, criteria );
  }, 'scalar' );
}


ActiveRecord.prototype.count_by_sql = function( sql, params ) {
  this.log( 'count_by_sql' );

  var builder = this.get_command_builder();

  return this.__wrap_to_get_table( function( table ) {
    return builder.create_sql_command( sql, params );
  }, 'scalar' );
}


ActiveRecord.prototype.count_by_attributes = function ( attributes, condition, params ) {
  this.log( 'count_by_attributes' );

  var builder = this.get_command_builder();
  var prefix  = this.get_table_alias() + '.';

  return this.__wrap_to_get_table( function( table ) {
    var criteria = builder.create_column_criteria( table, attributes, condition, params, prefix );

    return builder.create_count_command( table, criteria );
  }, 'scalar' );
};


ActiveRecord.prototype.exists = function( condition, params ) {
  this.log( 'exists' );

  var criteria    = this.get_command_builder().create_criteria( condition, params );
  criteria.select = '*';
  criteria.limit  = 1;

  return this.__wrap_to_get_table( function( table, emitter ) {
    var command = this.get_command_builder().create_find_command( table, criteria );
    var self    = this;

    command.execute( function( e, result ) {
      if ( e ) return emitter.emit( 'error', e );

      emitter.emit( 'success', !!result.get_num_rows() );
    } );
  } );
}


ActiveRecord.prototype.update_by_pk = function( pk, attributes, condition, params ) {
  this.log( 'update_by_pk' );

  return this.__wrap_to_get_table( function( table ) {
    var builder   = this.get_command_builder();
    var criteria  = builder.create_pk_criteria( table, pk, condition, params );

    return builder.create_update_command( table, attributes, criteria );
  } );
}


ActiveRecord.prototype.update_all = function( attributes, condition, params ) {
  this.log( 'update_all' );

  return this.__wrap_to_get_table( function( table ) {
    var builder   = this.get_command_builder();
    var criteria  = builder.create_criteria( condition, params );

    return builder.create_update_command( table, attributes, criteria );
  } );
}


ActiveRecord.prototype.update_counters = function( counters, condition, params ) {
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


ActiveRecord.prototype.remove_all = function( condition, params ) {
  this.log( 'remove_all' );

  return this.__wrap_to_get_table( function( table ) {
    var builder   = this.get_command_builder();
    var criteria  = builder.create_criteria( condition, params );

    return builder.create_delete_command( table, criteria );
  });
}


ActiveRecord.prototype.remove_all_by_attributes = function( attributes, condition, params ) {
  this.log( 'remove_all_by_attributes' );

  return this.__wrap_to_get_table( function( table ) {

    var builder   = this.get_command_builder();
    var criteria  = builder.create_column_criteria( table, attributes, condition, params );

    return builder.create_delete_command( table, criteria );
  });
}
