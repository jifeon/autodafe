var DbCriteria    = require('./db_criteria');
var DbExpression  = require('./db_expression');
var AppModule     = global.autodafe.AppModule;

module.exports = CommandBuilder.inherits( AppModule );

function CommandBuilder( params ) {
  this._init( params );
}


CommandBuilder.prototype.PARAM_PREFIX = ':ap';


CommandBuilder.prototype._init = function( params ) {
  CommandBuilder.parent._init.call( this, params );

  var DbSchema = require( './db_schema' );
  if ( !DbSchema.is_instantiate( params.db_schema ) )
    throw new Error( '`db_schema` is not instance of DbSchema in CommandBuilder.init' );

  this._.db_schema      = params.db_schema;
  this._.db_connection  = this.db_schema.db_connection;
};


CommandBuilder.prototype.create_find_command = function( table, criteria, alias ) {
  var select = criteria.select;

  alias = criteria.alias ? criteria.alias : alias || 't';
  alias = this.db_schema.quote_table_name( alias );

  var sql = ( criteria.distinct ? 'SELECT DISTINCT ' : 'SELECT ' ) +
            select + " FROM " + table.raw_name + " AS "  + alias;
  sql = this.apply_join(      sql, criteria.join      );
  sql = this.apply_condition( sql, criteria.condition );
  sql = this.apply_group(     sql, criteria.group     );
  sql = this.apply_having(    sql, criteria.having    );
  sql = this.apply_order(     sql, criteria.order     );
  sql = this.apply_limit(     sql, criteria.limit, criteria.offset );

  return this.create_sql_command( sql, criteria.params );
}


CommandBuilder.prototype.create_count_command = function( table, criteria, alias ) {

  alias = criteria.alias != '' ? criteria.alias : alias || 't';
  alias = this.db_schema.quote_table_name( alias );

  var sql = ( criteria.distinct ? 'SELECT DISTINCT' : 'SELECT' ) +
            " COUNT(*) FROM " + table.raw_name + " AS " + alias;
  sql = this.apply_join( sql, criteria.join );
  sql = this.apply_condition( sql, criteria.condition );

  return this.create_sql_command( sql, criteria.params );
}


CommandBuilder.prototype.create_delete_command = function( table, criteria ) {

  var sql = "DELETE FROM " +table.raw_name;
  sql = this.apply_join(      sql, criteria.join      );
  sql = this.apply_condition( sql, criteria.condition );
  sql = this.apply_group(     sql, criteria.group     );
  sql = this.apply_having(    sql, criteria.having    );
  sql = this.apply_order(     sql, criteria.order     );
  sql = this.apply_limit(     sql, criteria.limit, criteria.offset );

  return this.create_sql_command( sql, criteria.params );
}

CommandBuilder.prototype.create_insert_command = function( table, data, ignore ){

  var fields        = [];
  var values        = {};
  var placeholders  = [];

  var i = 0;
  var subplaceholders = [];
  for ( var column_name in data ) {
    var value   = data[ column_name ];
    var column  = table.get_column( column_name );

    if ( !column ) {
      this.log(
        'CommandBuilder.create_insert_command can\'t find column `%s` in table `%s`'.format( column_name, table.name ),
        'warning'
      );
      continue;
    }

    if ( value == null && !column.allow_null ) {
      this.log(
        'CommandBuilder.create_insert_command has aborted try of setting NULL to column `%s` in table `%s`, which is not allow NULL'.format( column_name, table.name ),
        'warning'
      );
      continue;
    }

    fields.push( column.raw_name );

    if( !Array.isArray( value ) ) value = [ value ];

    for( var v = 0, ln = value.length; v < ln; v++ ){
      if( !subplaceholders[ v ] ) subplaceholders[ v ] = [];

      if ( value[ v ] instanceof DbExpression ) {
        subplaceholders[v].push( value[v].expression );

        for ( var n in value[v].params ) {
          values[ n ] = value[v].params[ n ];
        }
      }
      else {
        subplaceholders[ v ].push( this.PARAM_PREFIX + i );
        values[ this.PARAM_PREFIX + i ] = column.typecast( value[ v ] );
        i++;
      }
    }
  }

  for( var v = 0, ln = subplaceholders.length; v < ln; v++ ){
    placeholders.push( '(subplaceholder)'.format( {
      subplaceholder : subplaceholders[ v ].join( ', ' )
      })
    );
  }

  if ( !fields.length ) {

    table.each_primary_key( function( pk ) {
      fields.push( table.get_column( pk ).raw_name );
      placeholders.push( 'NULL' );
    } );
  }

  var sql = "INSERT {IGNORE}INTO table (fields) VALUES placeholders".format({
    '{IGNORE}'    : ignore ? 'IGNORE ' : '',
    table         : table.raw_name,
    fields        : fields.join(', '),
    placeholders  : placeholders.join(', ')
  });

  return this.create_sql_command( sql, values );
}


CommandBuilder.prototype.create_update_command = function( table, data, criteria ) {

  var fields = [];
  var values = {};
  var i      = 0;

  for ( var column_name in data ) {
    var value   = data[ column_name ];
    var column  = table.get_column( column_name );

    if ( !column ) {
      this.log(
        'CommandBuilder.create_update_command can\'t find column `%s` in table `%s`'.format( column_name, table.name ),
        'warning'
      );
      continue;
    }

    if ( value instanceof DbExpression ) {
      fields.push( column.raw_name + '=' + value.expression );

      for ( var n in value.params ) {
        values[ n ] = value.params[ n ];
      }
    }
    else {
      fields.push( column.raw_name + '=' + this.PARAM_PREFIX + i );
      values[ this.PARAM_PREFIX + i ] = column.typecast( value );
      i++;
    }
  }

  if ( !fields.length )
    throw new Error( 'CommandBuilder.create_update_command: No columns are being updated for table ' + table.name );

  var sql = "UPDATE " + table.raw_name + " SET " + fields.join( ', ' );
  sql = this.apply_join(      sql, criteria.join      );
  sql = this.apply_condition( sql, criteria.condition );
  sql = this.apply_order(     sql, criteria.order     );
  sql = this.apply_limit(     sql, criteria.limit, criteria.offset );

  return this.create_sql_command( sql, Object.merge( values, criteria.params ) );
}


CommandBuilder.prototype.create_update_counter_command = function( table, counters, criteria ) {

  var fields = [];

  for ( var column_name in counters ) {
    var value   = counters[ column_name ];
    var column  = table.get_column( column_name );

    if ( !column ) {
      this.log(
        'CommandBuilder.create_update_counter_command can\'t find column `%s` in table `%s`'.format( column_name, table.name ),
        'warning'
      );
      continue;
    }

    fields.push( column.raw_name + '=' + column.raw_name + ( value < 0 ? '' : '+' ) + value );
  }

  if ( !fields.length )
    throw new Error( 'No counter columns are being updated for table ' + table.name );

  var sql = "UPDATE " + table.raw_name + " SET " + fields.join(', ');
  sql = this.apply_join(      sql, criteria.join      );
  sql = this.apply_condition( sql, criteria.condition );
  sql = this.apply_order(     sql, criteria.order     );
  sql = this.apply_limit(     sql, criteria.limit, criteria.offset );

  return this.create_sql_command( sql, criteria.params );

}


CommandBuilder.prototype.create_sql_command = function( sql, params ) {
  return this.db_connection.create_command( sql ).bind_values( params || {} );
}


CommandBuilder.prototype.apply_join = function( sql, join ) {
  return join != '' ? sql + ' ' + join : sql;
};


CommandBuilder.prototype.apply_condition = function( sql, condition ) {
  return condition != '' ? sql + ' WHERE ' + condition : sql;
};


CommandBuilder.prototype.apply_order = function( sql, order_by ) {
  return order_by != '' ? sql + ' ORDER BY ' + order_by : sql;
};


CommandBuilder.prototype.apply_limit = function( sql, limit, offset ) {
  if ( limit >= 0 ) sql += ' LIMIT ' + Math.round( limit );
  if ( offset > 0 ) sql += ' OFFSET ' + Math.round( offset );

  return sql;
}


CommandBuilder.prototype.apply_group = function( sql, group ) {
  return group != '' ? sql + ' GROUP BY ' + group : sql;
}


CommandBuilder.prototype.apply_having = function( sql, having ) {
  return having != '' ? sql + ' HAVING ' + having : sql;
};


CommandBuilder.prototype.create_criteria = function( condition, params ) {
  condition = condition || '';
  params    = params    || {};

  var criteria;
  if ( condition instanceof DbCriteria ) criteria = condition.clone();
  else if ( condition instanceof Object ) criteria = new DbCriteria( condition );
  else criteria = new DbCriteria({
    condition : condition,
    params    : params
  });

  return criteria;
}


CommandBuilder.prototype.create_pk_criteria = function( table, pk, condition, params, prefix ) {

  var criteria = this.create_criteria( condition, params );
  if ( criteria.alias != '' ) prefix = this.db_schema.quote_table_name( criteria.alias ) + '.';

  if ( !Object.isObject( pk ) && !Array.isArray( pk ) ) pk = [ pk ];
  if ( table.primary_key instanceof Array && Object.isObject( pk ) && !Object.isEmpty( pk ) ) // single composite key
    pk = [ pk ];

  condition = this.create_in_condition( table, table.primary_key, pk, prefix );

  if ( criteria.condition != '' ) criteria.condition = condition + ' AND (' + criteria.condition + ')';
  else criteria.condition = condition;

  return criteria;
}


CommandBuilder.prototype.create_pk_condition = function( table, values, prefix ) {
  return this.create_in_condition( table, table.primary_key, values, prefix );
}


CommandBuilder.prototype.create_column_criteria = function( table, columns, condition, params, prefix ) {

  var criteria = this.create_criteria( condition, params );
  if ( criteria.alias != '' ) prefix = this.db_schema.quote_table_name( criteria.alias ) + '.';

  var conditions  = [];
  var values      = {};
  var i = 0;

  if ( prefix == null ) prefix = table.raw_name + '.';
  for ( var name in columns ) {
    var value   = columns[ name ];
    var column  = table.get_column( name );

    if ( column == null ) throw new Error( 'Table ' + table.name + ' does not have a column named ' + name );

    if ( value instanceof Array )
      conditions.push( this.create_in_condition( table, name, value, prefix ) );
    else if ( value != null ) {
      conditions.push( prefix + column.raw_name + '=' + this.PARAM_PREFIX + i );
      values[ this.PARAM_PREFIX + i ] = value;
      i++;
    }
    else
      conditions.push( prefix + column.raw_name + ' IS NULL' );
  }

  criteria.params = Object.merge( values, criteria.params );
  if ( conditions[0] != undefined ) {
    if ( criteria.condition != '' )
      criteria.condition = conditions.join( ' AND ' ) + ' AND (' + criteria.condition + ')';
    else
      criteria.condition = conditions.join( ' AND ' )
  }
  return criteria;
}


CommandBuilder.prototype.__get_exist_column = function ( table, column_name ) {
  var column = table.get_column( column_name );
  if ( !column )
      throw new Error( 'Table "%s" does not have a column named "%s"'.format( table.name, column_name ) );
  return column;
};


CommandBuilder.prototype.create_in_condition = function( table, column_name, values, prefix ) {
  if ( Object.isEmpty( values ) ) return '0=1';

  if ( !prefix ) prefix = table.raw_name + '.';

  var column;
  var value;
  if ( typeof column_name == "string" ) {      // single key

    column = this.__get_exist_column( table, column_name );

    values = values.map( function( value ) {
      return this.db_connection.quote_value( column.typecast( value ) );
    }, this );

    if ( values.length == 1 )
      return prefix + column.raw_name + ( values[0] == 'NULL' ? ' IS NULL' : '=' + values[0] );
    else
      return prefix + column.raw_name + ' IN (' + values.join(', ') + ')';
  }

  else if ( column_name instanceof Object ) {// composite key: values=array(array('pk1'=>'v1','pk2'=>'v2'),array(...))

    Object.values( column_name ).forEach( function( name ) {
      column = this.__get_exist_column( table, name );

      values.forEach( function( value ) {

        if ( typeof value[ name ] == 'undefined' )
          throw new Error( 'The value for the column `%s` is not supplied when querying the table `%s`'.format( name, table.name ) );

        value[ name ] = this.db_connection.quote_value( column.typecast( value[ name ] ) );

    }, this ); }, this );

    if ( values.length == 1 ) {
      var entries = [];
      for ( var name in values[0] ) {
        value = values[0][ name ];
        entries.push( prefix + table.get_column( name ).raw_name + ( value == 'NULL' ? ' IS NULL' : '=' + value ) );
      }

      return entries.join( ' AND ' );
    }

    return this._create_composite_in_condition( table, values, prefix );
  }

  else
    throw new Error( 'Column name must be either a string or an array ( now: {column_name} ).'.format( {
      '{column_name}' : column_name
    } ) );
}


CommandBuilder.prototype._create_composite_in_condition = function( table, values, prefix ) {
  var key_names = [];
  for ( var name in values[0] ) key_names.push( prefix + table.get_column(name).raw_name );

  values = values.map( function( value ) {
    return '(' + Object.values( value ).join( ', ' ) + ')';
  } ).join(', ');

  return '(' + key_names.join( ', ' ) + ') IN (' + values + ')';
}

