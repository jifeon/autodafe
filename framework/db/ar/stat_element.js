var app_module = global.autodafe.AppModule;

module.exports = StatElement.inherits( app_module );

function StatElement( params ) {
  this._init( params );
}


StatElement.prototype._init = function( params ) {
  StatElement.parent._init.call( this, params );

  var ActiveFinder = require( './active_finder' );
  if ( !ActiveFinder.is_instantiate( params.finder ) ) throw new Error(
    '`finder` is required and should be instance of ActiveFinder in StatRelation.init'
  );
  this._finder          = params.finder;

  var JoinElement = require( './join_element' );
  if ( !JoinElement.is_instantiate( params.parent ) ) throw new Error(
    '`parent` is required and should be instance of StatRelation in StatElement.init'
  );
  this._parent          = params.parent;
  this._parent.stats.push( this );

  var StatRelation = require( './relations/stat_relation' );
  if ( !StatRelation.is_instantiate( params.relation ) ) throw new Error(
    '`relation` is required and should be instance of StatRelation in StatElement.init'
  );
  this.relation          = params.relation;
};


StatElement.prototype.query = function( callback ) {
  var matches = /^\s*(.*?)\((.*)\)\s*/.exec( this.relation.foreign_key );

  try {
    if( matches )
      this._query_many_many( matches[1], matches[2], callback );
    else
      this._query_one_many( callback );
  } catch (e){
    callback(e);
  }
}



StatElement.prototype._query_one_many = function( callback ) {
  var relation  = this.relation;
  var model     = relation.model;
  var builder   = model.get_command_builder();
  var schema    = builder.db_schema;
  var table     = model.table;
  var parent    = this._parent;
  var pk_table  = parent.model.table;
  var self      = this;

  var fks = relation.foreign_key.trim().split( /\s*,\s*/ );
  if ( fks.length != pk_table.get_number_of_pks() ) throw new Error(
    'The relation `{relation}` in active record class `{class}` is specified with an invalid foreign key.\
     The columns in the key must match the primary keys of the table `{table}`.'.format({
      '{relation}'  : relation.name,
      '{class}'     : parent.model.class_name,
      '{table}'     : pk_table.name
    })
  );

  // set up mapping between fk and pk columns
  var map = {};  // { pk : fk, ... }
  fks.forEach( function( fk, i ){
    if ( !table.get_column( fk )) throw new Error(
      'The relation `{relation}` in active record class `{class}` is specified with an invalid foreign key `{key}`.\
       There is no such column in the table `{table}`.'.format({
        '{relation}'  : relation.name,
        '{class}'     : parent.model.class_name,
        '{table}'     : pk_table.name,
        '{key}'       : fk
      })
    );

    if( table.foreign_keys[fk] ) {
      var table_name = table.foreign_keys[fk][0];
      var pk         = table.foreign_keys[fk][1];

      if( schema.compare_table_names( pk_table.raw_name, table_name ) )
        map[ pk ] = fk;
      else throw new Error(
        'The relation `{relation}` in active record class `{class}` is specified with a foreign key `{key}` \
         that does not point to the parent table `{table}`.'.format({
          '{relation}'  : relation.name,
          '{class}'     : parent.model.class_name,
          '{table}'     : pk_table.name,
          '{key}'       : fk
        })
      );
    }

    else  // fk constraints undefined
      if( Array.isArray( pk_table.primary_key )) // composite pk
        map[ pk_table.primary_key[ i ]] = fk;
      else
        map[ pk_table.primary_key ] = fk;
  });

//  var records = this._parent.records;

  var where   = !relation.condition ? ' WHERE ' : ' WHERE (' + relation.condition + ') AND ';
  var group   = !relation.group     ? ''        : ', ' + relation.group;
  var having  = !relation.having    ? ''        : ' HAVING (' + relation.having + ')';
  var order   = !relation.order     ? ''        : ' ORDER BY ' + relation.order;

  var c = schema.quote_column_name('c');
  var s = schema.quote_column_name('s');

  var table_alias = model.get_table_alias( true );
  var condition   = builder.create_in_condition( table, fks[0], this._parent.get_records_keys(), table_alias + '.' );

  // generate and perform query
  if( fks.length == 1 ) {  // single column fk
    var col = table.get_column( fks[0] ).raw_name;
    var sql = [ 'SELECT ', col, ' AS ', c, ', ', relation.select, ' AS ', s, ' FROM ', table.raw_name, ' ', table_alias,
      where, '(', condition, ') GROUP BY ', col, group, having, order ].join('');

    var command = builder.db_connection.create_command( sql );

    if ( Object.isObject( relation.params ))
      command.bind_values( relation.params );

    command.execute( function( e, result ){
      var stats = {};
      if ( e ) return callback( e );

      result.fetch_obj( function( row ){
        stats[ row.c ] = row.s;
      } );

      // populate the results into existing records
      self._parent.enum_records( function( record, pk ){
        record.add_related_record( relation.name, stats[pk] ? stats[pk] : relation.default_value, false );
      } );

      callback();
    } );
  }

  else  // composite fk
  {
    var keys = this._parent.get_records_keys().map( function( key ){
      var key2 = JSON.parse( key );
      key = {};
      pk_table.each_primary_key( function( pk ){
        key[ map[ pk ] ] = key2[ pk ];
      } );
      return key;
    } );

    var cols = {};

    pk_table.each_primary_key( function( pk, i ){
      var name = table.get_column( map[ pk ] ).raw_name;
      cols[ name ] = name + ' AS ' + schema.quote_column_name( 'c' + i );
    } );

    var condition = builder.create_in_condition( table, fks, keys, table_alias + '.' );
    var sql = [ 'SELECT ', Object.values( cols ).join(', '), ', ', relation.select, ' AS ', s, ' FROM ', table.raw_name, ' ', table_alias,
      where, '(', condition, ') group by ', Object.keys( cols ).join(', '), group, having, order ].join('');

    var command = builder.db_connection.create_command( sql );
    if( Object.isObject( relation.params ))
      command.bind_values( relation.params );

    command.execute( function( e, result ){
      var stats = {};
      if ( e ) return callback( e );

      result.fetch_obj( function( row ){
        var key = {};
        pk_table.each_primary_key( function( pk, i ){
          key[ pk ] = row[ 'c'+i ];
        } );
        stats[ JSON.stringify( key ) ] = row.s;
      } );

      // populate the results into existing records
      self._parent.enum_records( function( record, pk ){
        record.add_related_record( relation.name, stats[pk] ? stats[pk] : relation.default_value, false );
      } );

      callback();
    } );
  }
}


StatElement.prototype._query_many_many = function( join_table_name, keys, callback ){
  var relation    = this.relation;
  var model       = relation.model;
  var table       = model.table;
  var builder     = model.get_command_builder();
  var schema      = builder.db_schema;
  var pk_table    = this._parent.model.table;
  var table_alias = model.get_table_alias( true );
  var self        = this;

  schema.get_table( join_table_name, function( e, join_table ){
    if ( e ) return callback( e );

    if ( !join_table ) return callback( new Error(
      'The relation `{relation}` in active record class `{class}` is not specified correctly.\
       The join table `{join_table}` given in the foreign key cannot be found in the database.'.format({
        '{relation}'    : relation.name,
        '{class}'       : this._parent.model.class_name,
        '{join_table}'  : join_table_name
      })
    ));

    var fks = keys.trim().split( /\s*,\s*/ );
    if ( fks.length != table.get_number_of_pks() + pk_table.get_number_of_pks() ) return callback( new Error(
      'The relation `{relation}` in active record class `{class}` is specified with an invalid foreign key.\
       The foreign key must consist of columns referencing both joining tables.'.format({
        '{relation}'  : relation.name,
        '{class}'     : this._parent.model.class_name
      })
    ));

    var join_condition  = {};
    var map             = {};

    var fk_defined      = true;
    for ( var i = 0, i_ln = fks.length; i < i_ln; i++ ) {
      var fk = fks[i];

      if ( !join_table.get_column( fk )) return callback( new Error(
        'The relation `{relation}` in active record class `{class}` is specified with an invalid foreign key `{key}`.\
         There is no such column in the table `{table}`.'.format({
          '{relation}'  : relation.name,
          '{class}'     : this._parent.model.class_name,
          '{table}'     : join_table.name,
          '{key}'       : fk
        })
      ));

      if ( join_table.foreign_keys[fk] ) {
        var table_name = join_table.foreign_keys[fk][0];
        var pk         = join_table.foreign_keys[fk][1];

        if ( !join_condition[pk] && schema.compare_table_names( table.raw_name, table_name ))
          join_condition[pk] = table_alias + '.' + schema.quote_column_name(pk) + '=' +
                               join_table.raw_name + '.' + schema.quote_column_name(fk);

        else if( !map[pk] && schema.compare_table_names( pk_table.raw_name, table_name ))
          map[ pk ] = fk;

        else {
          fk_defined = false;
          break;
        }
      }
      else {
        fk_defined = false;
        break;
      }
    }

    if ( !fk_defined ) {
      join_condition = {};
      map            = {};

      fks.forEach( function( fk, i ){
        if( i < pk_table.get_number_of_pks() ) {
          pk = Array.isArray( pk_table.primary_key ) ? pk_table.primary_key[ i ] : pk_table.primary_key;
          map[ pk ] = fk;
        }
        else {
          var j = i - pk_table.get_number_of_pks();
          pk = Array.isArray( table.primary_key ) ? table.primary_key[ j ] : table.primary_key;
          join_condition[ pk ] = table_alias + '.' + schema.quote_column_name(pk) + '=' +
                                 join_table.raw_name + '.' + schema.quote_column_name(fk);
        }
      });
    }

    if( Object.isEmpty( join_condition ) || Object.isEmpty( map ) ) return callback( new Error(
      'The relation `{relation}` in active record class `{class}` is specified with an incomplete foreign key.\
       The foreign key must consist of columns referencing both joining tables.'.format({
        '{relation}'  : relation.name,
        '{class}'     : this._parent.model.class_name
      })
    ));

//    var records = this._parent.records;

    var cols = {};
    pk_table.each_primary_key( function( pk, i ){
      var name = join_table.raw_name + '.' + schema.quote_column_name( map[pk] );
      cols[ name ] = name + ' AS ' + schema.quote_column_name( 'c'+i );
    } );

    keys = this._parent.get_records_keys();
    if ( Array.isArray( pk_table.primary_key )) keys = keys.map( function( key ){
      var key2 = JSON.parse( key );
      key = {};
      pk_table.each_primary_key( function( pk ){
        key[ map[ pk ] ] = key2[ pk ];
      } );
      return key;
    } );

    var where   = !relation.condition ? '' : ' WHERE (' + relation.condition + ')';
    var group   = !relation.group     ? '' : ', ' + relation.group;
    var having  = !relation.having    ? '' : ' AND (' + relation.having + ')';
    var order   = !relation.order     ? '' : ' ORDER BY ' + relation.order;


    if ( Object.keys( map ).length == 1 ) map = Object.reset( map );


    var sql = [ 'SELECT ', this.relation.select, ' AS ', schema.quote_column_name('s'), ', ', Object.values( cols ).join(', '),
      ' FROM ', table.raw_name, ' ', table_alias, ' INNER JOIN ', join_table.raw_name,
      ' ON (', Object.values( join_condition ).join( ') AND (' ), ')',
      where, ' GROUP BY ', Object.keys( cols ).join(', '), group,
      ' HAVING (', builder.create_in_condition( join_table, map, keys ), ')',
      having, order ].join('');

    var command = builder.db_connection.create_command( sql );
    if( Object.isObject( relation.params ))
      command.bind_values( relation.params );

    command.execute( function( e, result ){

      var stats = {};
      if ( e ) return callback( e );

      result.fetch_obj( function( row ){
        if ( Array.isArray( pk_table.primary_key ) ) {
          var key = {};
          pk_table.each_primary_key( function( pk, i ){
            key[ pk ] = row[ 'c'+i ];
          } );
          stats[ JSON.stringify( key ) ] = row.s;
        }
        else stats[ row['c0'] ] = row['s'];
      } );

      // populate the results into existing records
      self._parent.enum_records( function( record, pk ){
        record.add_related_record( relation.name, stats[pk] ? stats[pk] : relation.default_value, false );
      } );

      callback();
    } );



  }, this );
}
