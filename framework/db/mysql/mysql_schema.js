var DBSchema          = require( '../db_schema' );
var MysqlTableSchema  = require( './mysql_table_schema' );
var MysqlColumnSchema  = require( './mysql_column_schema' );

var MysqlSchema = module.exports = function( params ) {
  this._init( params );
};


require( 'sys' ).inherits( MysqlSchema, DBSchema );


MysqlSchema.prototype._init = function( params ) {
  DBSchema.prototype._init.call( this, params );

  this.__table_names  = null;
  this.__scheme_names = null;
};


MysqlSchema.prototype.quote_table_name = function( name ) {
  return '`' + name + '`';
}


MysqlSchema.prototype.quote_column_name = function( name ) {
  return '`' + name + '`';
}


MysqlSchema.prototype.compare_table_names = function( name1, name2 ) {
  return DBSchema.prototype.compare_table_names.call( this, name1.toLowerCase(), name2.toLowerCase() );
};


//MysqlSchema.prototype.reset_sequence = function( table, value = null ) {
//  if ( table.sequence_name !== null ) {
//    if ( value === null )
//      value = this.get_db_connection().create_command( "_s_e_l_e_c_t _m_a_x(`{table.primary_key}`) _f_r_o_m {table.raw_name}" ).query_scalar() + 1;
//    else
//      value = (int)
//    value;
//    this.get_db_connection().create_command( "_a_l_t_e_r _t_a_b_l_e {table.raw_name} _a_u_t_o__i_n_c_r_e_m_e_n_t=value" ).execute();
//  }
//}


//MysqlSchema.prototype.check_integrity = function( check = true, schema = '' ) {
//  this.get_db_connection().create_command( '_s_e_t _f_o_r_e_i_g_n__k_e_y__c_h_e_c_k_s='.(check ? 1 : 0) ).execute();
//}


MysqlSchema.prototype._create_table = function( name ) {
  var table = new MysqlTableSchema;
  this._resolve_table_names( table, name );

  var self = this;

  this._find_columns( table ).on( 'complete', function() {
    self._find_constraints( table );
  } );

  return table;
}


MysqlSchema.prototype._resolve_table_names = function( table, name ) {
  var parts = name.replace( '`', '' ).split( '.' );
  if ( parts[1] ) {
    table.schema_name = parts[0];
    table.name        = parts[1];
    table.raw_name    = this.quote_table_name( table.schema_name ) + '.' + this.quote_table_name( table.name );
  }
  else {
    table.name      = parts[0];
    table.raw_name  = this.quote_table_name( table.name );
  }
}


MysqlSchema.prototype._find_columns = function( table ) {
  var sql             = 'SHOW COLUMNS FROM ' + table.raw_name;
  var columns_emitter = this.get_db_connection().create_command( sql ).execute();

  var schema = this;

  columns_emitter.on( 'complete', function( result, db ) {

    db.fetch_obj( result, function( column ) {
      var c = schema._create_column( column );
      table.columns[ c.name ] = c;

      if ( c.is_primary_key ) {

        if ( table.primary_key == null )
          table.primary_key = c.name;

        else if ( typeof table.primary_key == "string" )
          table.primary_key = [ table.primary_key, c.name ];

        else
          table.primary_key.push( c.name );

        if ( column['Extra'].toLowerCase().indexOf( 'auto_increment' ) != -1 )
          table.sequence_name = '';
      }
    });

    table.init_param( 'columns' );
  } );

  return columns_emitter;
}


MysqlSchema.prototype._create_column = function( column ) {
  var c             = new MysqlColumnSchema;

  c.name            = column['Field'];
  c.raw_name        = this.quote_column_name( c.name );
  c.allow_null      = column['Null'] == 'YES';
  c.is_primary_key  = column['Key'].indexOf( 'PRI' ) != -1;
  c.is_foreign_key  = false;

  c.deferred_init( column['Type'], column['Default'] );

  return c;
}


//MysqlSchema.prototype._get_server_version = function() {
//  version = this.get_db_connection().get_attribute( _p_d_o::_a_t_t_r__s_e_r_v_e_r__v_e_r_s_i_o_n );
//  digits = array();
//  preg_match( '/(\d+)\.(\d+)\.(\d+)/', version, digits );
//  return floatval( digits[1].
//  '.'.digits[2].digits[3]
//)
//  ;
//}


MysqlSchema.prototype._find_constraints = function( table ) {
  var emitter = this.get_db_connection().create_command( 'SHOW CREATE TABLE ' + table.raw_name ).execute();

  emitter.on( 'complete', function( result, db ) {
    db.fetch_array( result, function( row ) {

      var matches = [];
      var regexp  = /FOREIGN KEY\s+\(([^\)]+)\)\s+REFERENCES\s+([^\(^\s]+)\s*\(([^\)]+)\)/mig;

      var sql;
      for ( var i = 0, i_ln = row.length; i < i_ln; i++ ) {
        sql = row[ i ];
        if ( matches = sql.match( regexp ) ) break;
      }

      var foreign = [];
      if ( matches ) for ( var m = 0, m_ln = matches.length; m < m_ln; m++ ) {
        var match = matches[m];

        var keys  = match[1].replace( /`|\s/g, '' ).split( ',' );
        var fks   = match[3].replace( /`|\s/g, '' ).split( ',' );

        for ( var k = 0, k_ln = keys.length; k < k_ln; k++ ) {
          var name = keys[ k ];

          table.foreign_keys[ name ] = [ match[2].replace( '`', '' ), fks[k] ];
          if ( table.columns[ name ] ) table.columns[ name ].is_foreign_key = true;
        }
      }
    });

    table.init_param( 'foreign_keys' );
  });


}


//MysqlSchema.prototype._find_table_names = function( schema = '' ) {
//  if ( schema === '' )
//    return this.get_db_connection().create_command( '_s_h_o_w _t_a_b_l_e_s' ).query_column();
//  names = this.get_db_connection().create_command( '_s_h_o_w _t_a_b_l_e_s _f_r_o_m '.
//  this.quote_table_name( schema )
//).
//  query_column();
//  foreach( names
//  as & name
//)
//  name = schema.
//  '.'.name;
//  return names;
//}