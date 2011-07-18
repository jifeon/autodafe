var AppModule = require('app_module');
var JoinQuery = require('./join_query');

module.exports = JoinElement.inherits( AppModule );

function JoinElement( params ) {
  this._init( params );
}


JoinElement.prototype._init = function( params ) {
  this.super_._init( params );

  var ActiveFinder = require( './active_finder' );
  if ( !ActiveFinder.is_instantiate( params.finder ) ) throw new Error(
    '`finder` is required and should be instance of ActiveFinder in JoinElement.init'
  );
  this._finder          = params.finder;

  this.id               = params.id       || 0;
  this.relation         = params.relation || null;
  this.model            = params.model    || this.relation.model;
  this.records          = {};
  this.children         = {};
  this.stats            = [];
  this.table_alias      = this.relation ? this.relation.alias || this.relation.name : this.model.get_table_alias();

  this._parent          = params.parent   || null;
  this._builder         = this._parent ? this._parent._builder : this.model.get_command_builder();
  this._joined          = false;
  this._related         = {};     // pk, relation name, related pk => true

  this.raw_table_alias  = this._builder.db_schema.quote_table_name( this.table_alias );
};


JoinElement.prototype.get_table = function ( callback ) {
  this.model.get_table( callback, this );
};


JoinElement.prototype.get_column_aliases = function ( table ) {
  var prefix  = 't' + this.id + '_c';
  var aliases   = {};
  var pk_alias  = {};

  table.get_column_names().forEach( function( name, i ){
    var alias       = prefix + i;
    aliases[ name ] = alias;

    if( table.primary_key == name ) pk_alias = alias;
    else if( Array.isArray( table.primary_key ) && ~table.primary_key.indexOf( name ) )
      pk_alias[ name ] = alias;
  }, this );

  this.get_column_aliases = function() {
    return aliases;
  }

  this.get_pk_alias = function() {
    return pk_alias;
  }

  return aliases;
};


JoinElement.prototype.get_pk_alias = function ( table ) {
  this.get_column_aliases( table );

  return this.get_pk_alias();
};


//
//  /**
//   * removes references to child elements and finder to avoid circular references.
//   * this is internally used.
//   */
//  JoinElement.prototype.destroy = function()
//  {
//    if(!empty(this.children))
//    {
//      foreach(this.children as child)
//        child.destroy();
//    }
//    unset(this._finder, this._parent, this.model, this.relation, this.records, this.children, this.stats);
//  }
//
//  /**
//   * performs the recursive finding with the criteria.
//   * @param cdb_criteria criteria the query criteria
//   */
//  JoinElement.prototype.find = function(criteria=null)
//  {
//    if(this._parent===null) // root element
//    {
//      query=new cjoin_query(this,criteria);
//      this._finder.base_limited=(criteria.offset>=0 || criteria.limit>=0);
//      this.build_query(query);
//      this._finder.base_limited=false;
//      this.run_query(query);
//    }
//    else if(!this._joined && !empty(this._parent.records)) // not joined before
//    {
//      query=new cjoin_query(this._parent);
//      this._joined=true;
//      query.join(this);
//      this.build_query(query);
//      this._parent.run_query(query);
//    }
//
//    foreach(this.children as child) // find recursively
//      child.find();
//
//    foreach(this.stats as stat)
//      stat.query();
//  }
//


//ActiveRecord.prototype._wrap_to_get_table = function ( fun ) {
//  var emitter = new Emitter;
//  var self    = this;
//
//  this.get_table( function( e, table ) {
//    if ( e ) return emitter.emit( 'error', e );
//
//    var res = fun.call( self, table, emitter );
//  });
//
//  return emitter;
//};


JoinElement.prototype.lazy_find = function( base_record, callback ) {
  this.get_table( function( err, table ) {
    if ( err ) return callback( err );

    if( typeof table.primary_key == 'string' )
      this.records[ base_record[ table.primary_key ] ] = base_record;

    else {
      var pk = {};
      table.each_primary_key( function( name ) {
        pk[name] = base_record[name];
      } )
      this.records[ JSON.stringify( pk ) ] = base_record;
    }

    this.stats.forEach( function( stat ){
      stat.query();
    } );

    var child = Object.reset( this.children );
    if ( !child ) return callback();

    var query = new JoinQuery({
      join_element : child,
      app          : this.app,
      table        : table
    });
    query.selects     = [ child.get_column_select( table, child.relation.select ) ];
    query.conditions  = [
      child.relation.condition,
      child.relation.on
    ];
    query.groups.push ( child.relation.group  );
    query.joins.push  ( child.relation.join   );
    query.havings.push( child.relation.having );
    query.orders.push ( child.relation.order  );

    if( Object.isObject( child.relation.params ))
      query.params = child.relation.params;

    query.elements[ child.id ] = true;
    if( child.relation.class_name == 'HasManyRelation' ) {
      query.limit   = child.relation.limit;
      query.offset  = child.relation.offset;
    }

//    child.before_find();
    var self = this;
    child._apply_lazy_condition( query, base_record, table, function( err ) {
      if ( err ) return callback( err );

      self._joined  = true;
      child._joined = true;

      self._finder.base_limited = false;
      child.build_query( query );
      child.run_query( query );
      Object.values( child.children ).forEach( function( child ) {
        child.find();
      } );

      if( Object.isEmpty( child.records )) return callback();

      if( child.relation.class_name == 'HasOneRelation' || child.relation.class_name == 'BelongsToRelation' )
        base_record.add_related_record( child.relation.name, child.records[0], false );

      else {  // has_many and many_many

        for ( var name in child.records ) {
          var record = child.records[ name ];
          var index = child.relation.index
            ? record[ child.relation.index ]
            : true;

          base_record.add_related_record( child.relation.name, record, index );
        }
      }

      callback();
    } );
  } );

}


JoinElement.prototype._apply_lazy_condition = function( query, record, parent_table, callback ) {
  var schema = this._builder.db_schema;
  var parent = this._parent;

  this.get_table( function( err, table ){
    if ( err ) return callback( err );

    if ( this.relation.class_name == 'ManyManyRelation' ) {

      var matches = this.relation.foreign_key.match( /^\s*(.*?)\((.*)\)\s*/ );
      if( !matches ) throw new Error(
        'The relation `%s` in active record class `%s` is specified with an invalid foreign key. \
         The format of the foreign key must be "join_table(fk1,fk2,...)".'.format( this.relation.name, parent.model.class_name )
      );

      schema.get_table( matches[1], function( err, join_table ) {
        if ( err ) return callback( err );

        if( !join_table ) throw new Error(
          'The relation `%s` in active record class `%s` is not specified correctly: \
           the join table `%s` given in the foreign key cannot be found in the database.'
           .format( this.relation.name, parent.model.class_name, matches[1] )
        );

        var fks               = matches[2].split( /\s*,\s*/ );
        var join_alias        = schema.quote_table_name( this.relation.name + '_' + this.table_alias);
        var parent_condition  = {};
        var child_condition   = {};
        var count             = 0;
        var params            = {};
        var fk_defined        = true;

        for( var i = 0, i_ln = fks.length; i < i_ln; i++ ) {
          var fk = fks[i];

  //        if( join_table.foreign_keys[fk] ) {  // fk defined
  //
  //          list(table_name,pk)=join_table.foreign_keys[fk];
  //          if(!isset(parent_condition[pk]) && schema.compare_table_names(parent.get_table(!!1).raw_name,table_name))
  //          {
  //            parent_condition[pk]=join_alias.'.'.schema.quote_column_name(fk).'=:ypl'.count;
  //            params[':ypl'.count]=record.pk;
  //            count++;
  //          }
  //          else if(!isset(child_condition[pk]) && schema.compare_table_names(this.get_table(!!1).raw_name,table_name))
  //            child_condition[pk]=this.get_column_prefix().schema.quote_column_name(pk).'='.join_alias.'.'.schema.quote_column_name(fk);
  //          else
  //          {
  //            fk_defined=false;
  //            break;
  //          }
  //        }
  //        else
  //        {
            fk_defined = false;
            break;
  //        }
        }

        if( !fk_defined ) {
          parent_condition  = {};
          child_condition   = {};
          count             = 0;
          params            = {};

          fks.forEach( function( fk, i ) {
            var length = Array.isArray( parent_table.primary_key ) ? parent_table.primary_key.length : 1;
            var pk;

            if( i < length ) {
              pk = Array.isArray( parent_table.primary_key) ? parent_table.primary_key[ i ] : parent_table.primary_key;
              parent_condition[ pk ] = join_alias + '.' + schema.quote_column_name(fk) + '=:ypl' + count;
              params[ ':ypl' + count ] = record[ pk ];
              count++;
            }
            else {
              var j = i - length;
              pk = Array.isArray( table.primary_key ) ? table.primary_key[ j ] : table.primary_key;
              child_condition[ pk ] = this.get_column_prefix( table ) + schema.quote_column_name( pk ) +
                '=' + join_alias + '.' + schema.quote_column_name( fk );
            }
          }, this );
        }

        if( !Object.isEmpty( parent_condition ) && !Object.isEmpty( child_condition ) ) {
          var join = 'INNER JOIN ' + join_table.raw_name + ' ' + join_alias + ' ON ';
          join +=
            '(' + Object.values( parent_condition ).join( ') and (' ) +
            ') and (' + Object.values( child_condition ).join( ') and ('  )  + ')';

          if( !this.relation.on ) join += ' AND (' + this.relation.on + ')';

          query.joins.push( join );
          for( var name in params)
            query.params[ name ] = params[ name ];
        }
        else throw new Error(
          'The relation `%s` in active record class `%s` is specified with an incomplete foreign key. \
           The foreign key must consist of columns referencing both joining tables.'.format( this.relation.name, parent.model.class_name )
        );

        callback();

      }, this );

    }
    else {
      var fks     = this.relation.foreign_key.split( /\s*,\s*/ );
      var params  = {};
      fks.forEach( function( fk, i ) {

        var pk;

        if( this.relation.class_name == 'BelongsToRelation' ) {

          if( parent_table.foreign_keys[ fk ] )  // fk defined
            pk = parent_table.foreign_keys[ fk ][ 1 ];

          else if( Array.isArray( table.primary_key ) ) // composite pk
            pk = table.primary_key[ i ];

          else
            pk = table.primary_key;

          params[ pk ] = record[ fk ];
        }
        else {

          if ( table.foreign_keys[ fk ] )  // fk defined
            pk = table.foreign_keys[ fk ][ 1 ];

          else if( Array.isArray( parent_table.primary_key ) ) // composite pk
            pk = parent_table.primary_key[ i ];

          else
            pk = parent_table.primary_key;

          params[ fk ] = record[ pk ];
        }
      }, this );

      var prefix  = this.get_column_prefix( table );
      var count   = 0;

      for( var name in params ) {
        query.conditions.push( prefix + schema.quote_column_name( name ) + '=:ypl' + count );
        query.params[ ':ypl' + count ] = params[ name ];
        count++;
      }

      callback();
    }
  });
}

//  /**
//   * performs the eager loading with the base records ready.
//   * @param mixed base_records the available base record(s).
//   */
//  JoinElement.prototype.find_with_base = function(base_records)
//  {
//    if(!is_array(base_records))
//      base_records=array(base_records);
//    if(is_string(this.get_table(!!1).primary_key))
//    {
//      foreach(base_records as base_record)
//       this this.records[base_record.{this.get_table(!!1).primary_key}]=base_record;
//    }
//    else
//    {
//      foreach(base_records as base_record)
//      {
//        pk=array();
//        foreach(this.get_table(!!1).primary_key as name)
//          pk[name]=base_record.name;
//        this.records[serialize(pk)]=base_record;
//      }
//    }
//
//    query=new cjoin_query(this);
//    this.build_query(query);
//    if(count(query.joins)>1)
//      this.run_query(query);
//    foreach(this.children as child)
//      child.find();
//
//    foreach(this.stats as stat)
//      stat.query();
//  }
//
//  /**
//   * count the number of primary records returned by the join statement.
//   * @param cdb_criteria criteria the query criteria
//   * @return string number of primary records. note: type is string to keep max. precision.
//   * @since 1.0.3
//   */
//  JoinElement.prototype.count = function(criteria=null)
//  {
//    query=new cjoin_query(this,criteria);
//    // ensure only one big join statement is used
//    this._finder.base_limited=false;
//    this._finder.join_all=true;
//    this.build_query(query);
//
//    select=is_array(criteria.select) ? implode(',',criteria.select) : criteria.select;
//    if(select!=='*' && !strncasecmp(select,'count',5))
//      query.selects=array(select);
//    else if(is_string(this.get_table(!!1).primary_key))
//    {
//      prefix=this.get_column_prefix();
//      schema=this._builder.get_schema();
//      column=prefix.schema.quote_column_name(this.get_table(!!1).primary_key);
//      query.selects=array("count(distinct column)");
//    }
//    else
//      query.selects=array("count(*)");
//
//    query.orders=query.groups=query.havings=array();
//    query.limit=query.offset=-1;
//    command=query.create_command(this._builder);
//    return command.query_scalar();
//  }
//
//  /**
//   * calls {@link cactive_record::before_find}.
//   * @param boolean is_child whether is called for a child
//   * @since 1.0.11
//   */
//  JoinElement.prototype.before_find = function(is_child=true)
//  {
//    if(is_child)
//      this.model.before_find_internal();
//
//    foreach(this.children as child)
//      child.before_find(true);
//  }
//
//  /**
//   * calls {@link cactive_record::after_find} of all the records.
//   * @since 1.0.3
//   */
//  JoinElement.prototype.after_find = function()
//  {
//    foreach(this.records as record)
//      record.after_find_internal();
//    foreach(this.children as child)
//      child.after_find();
//
//    this.children = null;
//  }

JoinElement.prototype.build_query = function( query ) {
  var self = this;

  Object.values( this.children ).forEach( function( child ) {
    if( child.relation.class_name == 'HasOneRelation' ||
        child.relation.class_name == 'BelongsToRelation' ||
        self._finder.join_all ||
        child.relation.together ||
        ( !self._finder.base_limited && child.relation.together == null )
    ) {
      child._joined = true;
      query.join( child );
      child.build_query( query );
    }
  } );
}

JoinElement.prototype.run_query = function( query ) {
  var command = query.create_command( this._builder );
//  foreach( command.query_all() as row )
//    this.populate_record(query,row);
  command.execute( function( err, result ) {
    console.log( result );
  } )
}

//  /**
//   * populates the active records with the query data.
//   * @param cjoin_query query the query executed
//   * @param array row a row of data
//   * @return cactive_record the populated record
//   */
//  JoinElement.prototype._populate_record = function(query,row)
//  {
//    // determine the primary key value
//    if(is_string(this._pk_alias))  // single key
//    {
//      if(isset(row[this._pk_alias]))
//        pk=row[this._pk_alias];
//      else	// no matching related objects
//        return null;
//    }
//    else // is_array, composite key
//    {
//      pk=array();
//      foreach(this._pk_alias as name=>alias)
//      {
//        if(isset(row[alias]))
//          pk[name]=row[alias];
//        else	// no matching related objects
//          return null;
//      }
//      pk=serialize(pk);
//    }
//
//    // retrieve or populate the record according to the primary key value
//    if(isset(this.records[pk]))
//      record=this.records[pk];
//    else
//    {
//      attributes=array();
//      aliases=array_flip(this._column_aliases);
//      foreach(row as alias=>value)
//      {
//        if(isset(aliases[alias]))
//          attributes[aliases[alias]]=value;
//      }
//      record=this.model.populate_record(attributes,false);
//      foreach(this.children as child)
//        record.add_related_record(child.relation.name,null,child.relation instanceof chas_many_relation);
//      this.records[pk]=record;
//    }
//
//    // populate child records recursively
//    foreach(this.children as child)
//    {
//      if(!isset(query.elements[child.id]))
//        continue;
//      child_record=child.populate_record(query,row);
//      if(child.relation instanceof chas_one_relation || child.relation instanceof cbelongs_to_relation)
//        record.add_related_record(child.relation.name,child_record,false);
//      else // has_many and many_many
//      {
//        // need to double check to avoid adding duplicated related objects
//        if(child_record instanceof cactive_record)
//          fpk=serialize(child_record.get_primary_key());
//        else
//          fpk=0;
//        if(!isset(this._related[pk][child.relation.name][fpk]))
//        {
//          if(child_record instanceof cactive_record && child.relation.index!==null)
//            index=child_record.{child.relation.index};
//          else
//            index=true;
//          record.add_related_record(child.relation.name,child_record,index);
//          this._related[pk][child.relation.name][fpk]=true;
//        }
//      }
//    }
//
//    return record;
//  }

JoinElement.prototype.get_table_name_with_alias = function( table ) {
  if( this.table_alias ) return table.raw_name + ' ' + this.raw_table_alias;

  return table.raw_name;
}


JoinElement.prototype.get_column_select = function( table, select ) {
  select = select || '*';
  
  var schema          = this._builder.db_schema;
  var prefix          = this.get_column_prefix( table );
  var columns         = [];
  var column_aliases  = this.get_column_aliases( table );
  var column_names    = table.get_column_names();
  var pk_alias        = this.get_pk_alias( table );

  if ( select == '*' ) column_names.forEach( function( name ) {
    columns.push( 
      prefix + 
      schema.quote_column_name( name ) + ' AS ' +
      schema.quote_column_name( column_aliases[ name ] )
    );
  }, this ); 

  else {
    var selected = {};

    if( typeof select == 'string' ) select = select.split( /\s*,\s*/ );

    select.forEach( function( name ){
      
      var key;
      var dot_pos = name.lastIndexOf( '.' );

      if( ~dot_pos ) key = name.substr( dot_pos + 1 );
      else key = name;

      key = key.replace(/^['"`]*|['"`]*$/g, '');

      if( key == '*' ) return column_names.forEach( function( name ) {
        columns.push(
          prefix +
          schema.quote_column_name( name ) + ' AS ' +
          schema.quote_column_name( column_aliases[ name ] )
        );
      }, this );

      var matches
      if ( column_aliases[ key ] ) {  // simple column names
        columns.push(
          prefix +
          schema.quote_column_name( key ) + ' AS ' +
          schema.quote_column_name( column_aliases[key] )
        );
        selected[ column_aliases[ key ] ] = 1;
      }

      else if( matches = name.match( /^(.*?)\s+AS\s+(\w+)/im ) ) { // if the column is already aliased
        var alias = matches[2];
        if( !column_aliases[ alias ] || column_aliases[ alias ] != alias ) {
          column_aliases[ alias ] = alias;
          columns.push( name );
          selected[ alias ] = 1;
        }
      }

      else throw new Error(
        'Active record %s is trying to select an invalid column %s.\
         Note, the column must exist in the table or be an expression with alias.'.format( this.model.class_name, name )
      );
    }, this );


    // add primary key selection if they are not selected
    if( typeof pk_alias == 'string' && !selected[ pk_alias ] )
      columns.push(
        prefix +
        schema.quote_column_name( table.primary_key ) + ' AS ' +
        schema.quote_column_name( pk_alias )
      );

    else if( Object.isObject( pk_alias )) table.each_primary_key( function( name ) {
        if ( !selected[name] )
          columns.push(
            prefix +
            schema.quote_column_name( name ) + ' AS ' +
            schema.quote_column_name( pk_alias[ name ] )
          );
    }, this );
  }

  return columns.join(', ');
}


JoinElement.prototype.get_primary_key_select = function( table ) {
  var schema    = this._builder.db_schema;
  var prefix    = this.get_column_prefix( table );
  var columns   = [];
  var pk_alias  = this.get_pk_alias( table );

  if( typeof pk_alias == 'string' )
    columns.push(
      prefix +
      schema.quote_column_name( table.primary_key) + ' AS ' +
      schema.quote_column_name( pk_alias )
    );

  else if ( Object.isObject( pk_alias ))
    for ( var name in pk_alias )
      columns.push(
        prefix +
        schema.quote_column_name( name ) + ' AS ' +
        schema.quote_column_name( pk_alias[ name ] )
      );

  return columns.join(', ');
}


JoinElement.prototype.get_primary_key_range = function( table ) {
  if( Object.isEmpty( this.records )) return '';

  var values = Object.keys( this.records );
  if( Array.isArray( table.primary_key )) values = values.map( function( value ){
    return JSON.parse( value );
  });

  return this._builder.create_in_condition( table, table.primary_key, values, this.get_column_prefix( table ) );
}


JoinElement.prototype.get_column_prefix = function( table ) {
  if( this.table_alias ) return this.raw_table_alias + '.';

  return table.raw_name + '.';
}

//  /**
//   * @return string the join statement (this node joins with its parent)
//   */
//  JoinElement.prototype.get_join_condition = function()
//  {
//    parent=this._parent;
//    relation=this.relation;
//    if(this.relation instanceof cmany_many_relation)
//    {
//      if(!preg_match('/^\s*(.*?)\((.*)\)\s*/',this.relation.foreign_key,matches))
//        throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key. the format of the foreign key must be "join_table(fk1,fk2,...)".',
//          array('{class}'=>get_class(parent.model),'{relation}'=>this.relation.name)));
//
//      schema=this._builder.get_schema();
//      if((join_table=schema.get_table(matches[1]))===null)
//        throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is not specified correctly: the join table "{join_table}" given in the foreign key cannot be found in the database.',
//          array('{class}'=>get_class(parent.model), '{relation}'=>this.relation.name, '{join_table}'=>matches[1])));
//      fks=preg_split('/\s*,\s*/',matches[2],-1,preg_split_no_empty);
//
//      return this.join_many_many(join_table,fks,parent);
//    }
//    else
//    {
//      fks=preg_split('/\s*,\s*/',relation.foreign_key,-1,preg_split_no_empty);
//      if(this.relation instanceof cbelongs_to_relation)
//      {
//        pke=this;
//        fke=parent;
//      }
//      else
//      {
//        pke=parent;
//        fke=this;
//      }
//      return this.join_one_many(fke,fks,pke,parent);
//    }
//  }
//
//  /**
//   * generates the join statement for one-many relationship.
//   * this works for has_one, has_many and belongs_to.
//   * @param cjoin_element fke the join element containing foreign keys
//   * @param array fks the foreign keys
//   * @param cjoin_element pke the join element containg primary keys
//   * @param cjoin_element parent the parent join element
//   * @return string the join statement
//   * @throws cdb_exception if a foreign key is invalid
//   */
//  JoinElement.prototype._join_one_many = function(fke,fks,pke,parent)
//  {
//    schema=this._builder.get_schema();
//    joins=array();
//    foreach(fks as i=>fk)
//    {
//      if(!isset(fke.get_table(!!1).columns[fk]))
//        throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key "{key}". there is no such column in the table "{table}".',
//          array('{class}'=>get_class(parent.model), '{relation}'=>this.relation.name, '{key}'=>fk, '{table}'=>fke.get_table(!!1).name)));
//
//      if(isset(fke.get_table(!!1).foreign_keys[fk]))
//        pk=fke.get_table(!!1).foreign_keys[fk][1];
//      else  // fk constraints undefined
//      {
//        if(is_array(pke.get_table(!!1).primary_key)) // composite pk
//          pk=pke.get_table(!!1).primary_key[i];
//        else
//          pk=pke.get_table(!!1).primary_key;
//      }
//      joins[]=fke.get_column_prefix().schema.quote_column_name(fk) . '=' . pke.get_column_prefix().schema.quote_column_name(pk);
//    }
//    if(!empty(this.relation.on))
//      joins[]=this.relation.on;
//    return this.relation.join_type . ' ' . this.get_table_name_with_alias() . ' on (' . implode(') and (',joins).')';
//  }
//
//  /**
//   * generates the join statement for many-many relationship.
//   * @param cdb_table_schema join_table the join table
//   * @param array fks the foreign keys
//   * @param cjoin_element parent the parent join element
//   * @return string the join statement
//   * @throws cdb_exception if a foreign key is invalid
//   */
//  JoinElement.prototype._join_many_many = function(join_table,fks,parent)
//  {
//    schema=this._builder.get_schema();
//    join_alias=schema.quote_table_name(this.relation.name.'_'.this.table_alias);
//    parent_condition=array();
//    child_condition=array();
//
//    fk_defined=true;
//    foreach(fks as i=>fk)
//    {
//      if(!isset(join_table.columns[fk]))
//        throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key "{key}". there is no such column in the table "{table}".',
//          array('{class}'=>get_class(parent.model), '{relation}'=>this.relation.name, '{key}'=>fk, '{table}'=>join_table.name)));
//
//      if(isset(join_table.foreign_keys[fk]))
//      {
//        list(table_name,pk)=join_table.foreign_keys[fk];
//        if(!isset(parent_condition[pk]) && schema.compare_table_names(parent.get_table(!!1).raw_name,table_name))
//          parent_condition[pk]=parent.get_column_prefix().schema.quote_column_name(pk).'='.join_alias.'.'.schema.quote_column_name(fk);
//        else if(!isset(child_condition[pk]) && schema.compare_table_names(this.get_table(!!1).raw_name,table_name))
//          child_condition[pk]=this.get_column_prefix().schema.quote_column_name(pk).'='.join_alias.'.'.schema.quote_column_name(fk);
//        else
//        {
//          fk_defined=false;
//          break;
//        }
//      }
//      else
//      {
//        fk_defined=false;
//        break;
//      }
//    }
//
//    if(!fk_defined)
//    {
//      parent_condition=array();
//      child_condition=array();
//      foreach(fks as i=>fk)
//      {
//        if(i<count(parent.get_table(!!1).primary_key))
//        {
//          pk=is_array(parent.get_table(!!1).primary_key) ? parent.get_table(!!1).primary_key[i] : parent.get_table(!!1).primary_key;
//          parent_condition[pk]=parent.get_column_prefix().schema.quote_column_name(pk).'='.join_alias.'.'.schema.quote_column_name(fk);
//        }
//        else
//        {
//          j=i-count(parent.get_table(!!1).primary_key);
//          pk=is_array(this.get_table(!!1).primary_key) ? this.get_table(!!1).primary_key[j] : this.get_table(!!1).primary_key;
//          child_condition[pk]=this.get_column_prefix().schema.quote_column_name(pk).'='.join_alias.'.'.schema.quote_column_name(fk);
//        }
//      }
//    }
//
//    if(parent_condition!==array() && child_condition!==array())
//    {
//      join=this.relation.join_type.' '.join_table.raw_name.' '.join_alias;
//      join.=' on ('.implode(') and (',parent_condition).')';
//      join.=' '.this.relation.join_type.' '.this.get_table_name_with_alias();
//      join.=' on ('.implode(') and (',child_condition).')';
//      if(!empty(this.relation.on))
//        join.=' and ('.this.relation.on.')';
//      return join;
//    }
//    else
//      throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is specified with an incomplete foreign key. the foreign key must consist of columns referencing both joining tables.',
//        array('{class}'=>get_class(parent.model), '{relation}'=>this.relation.name)));
//  }
//}