var AppModule       = require('app_module');
var JoinElement     = require('./join_element');
var StatElement     = require('./stat_element');
var ActiveRelation  = require('./relations/active_relation');
var StatRelation    = require('./relations/stat_relation');

module.exports = ActiveFinder.inherits( AppModule );

function ActiveFinder( params ) {
  this._init( params );
}


ActiveFinder.prototype._init = function( params ) {
  this.super_._init( params );
  
  var Model = require('model');
  if ( !Model.is_instantiate( params.model ) ) throw new Error(
    '`model` is required in ActiveFinder.init'
  );
  this._model = params.model;

  if ( !params.With ) throw new Error(
    '`With` is required in ActiveFinder.init'
  );

  this.join_all     = false;
  this.base_limited = false;
  
  this._join_count  = 0;
  this._builder     = this._model.get_command_builder();
  this._join_tree   = new JoinElement({
    app    : this.app,
    finder : this,
    model  : this._model
  });

  this._build_join_tree( this._join_tree, params.With );
};


  /**
   * performs the relational query based on the given db criteria.
   * do not call this method. this method is used internally.
   * @param cdb_criteria criteria the db criteria
   * @param boolean all whether to bring back all records
   * @return mixed the query result
   */
//  ActiveFinder.prototype.query = function(criteria,all=false)
//  {
//    this.join_all=criteria.together===true;
//    this._join_tree.before_find(false);
//
//    if(criteria.alias!='')
//    {
//      this._join_tree.table_alias=criteria.alias;
//      this._join_tree.raw_table_alias=this._builder.get_schema().quote_table_name(criteria.alias);
//    }
//
//    this._join_tree.find(criteria);
//    this._join_tree.after_find();
//
//    if(all)
//    {
//      result = array_values(this._join_tree.records);
//      if (criteria.index!==null)
//      {
//        index=criteria.index;
//        array=array();
//        foreach(result as object)
//          array[object.index]=object;
//        result=array;
//      }
//    }
//    else if(count(this._join_tree.records))
//      result = reset(this._join_tree.records);
//    else
//      result = null;
//
//    this.destroy_join_tree();
//    return result;
//  }
//
//  /**
//   * this method is internally called.
//   * @param string sql the sql statement
//   * @param array params parameters to be bound to the sql statement
//   */
//  ActiveFinder.prototype.find_by_sql = function(sql,params=array())
//  {
//    yii::trace(get_class(this._join_tree.model).'.find_by_sql() eagerly','system.db.ar.cactive_record');
//    if((row=this._builder.create_sql_command(sql,params).query_row())!==false)
//    {
//      base_record=this._join_tree.model.populate_record(row,false);
//      this._join_tree.before_find(false);
//      this._join_tree.find_With_base(base_record);
//      this._join_tree.after_find();
//      this.destroy_join_tree();
//      return base_record;
//    }
//    else
//      this.destroy_join_tree();
//  }
//
//  /**
//   * this method is internally called.
//   * @param string sql the sql statement
//   * @param array params parameters to be bound to the sql statement
//   */
//  ActiveFinder.prototype.find_all_by_sql = function(sql,params=array())
//  {
//    yii::trace(get_class(this._join_tree.model).'.find_all_by_sql() eagerly','system.db.ar.cactive_record');
//    if((rows=this._builder.create_sql_command(sql,params).query_all())!==array())
//    {
//      base_records=this._join_tree.model.populate_records(rows,false);
//      this._join_tree.before_find(false);
//      this._join_tree.find_With_base(base_records);
//      this._join_tree.after_find();
//      this.destroy_join_tree();
//      return base_records;
//    }
//    else
//    {
//      this.destroy_join_tree();
//      return array();
//    }
//  }
//
//  /**
//   * this method is internally called.
//   * @param cdb_criteria criteria the query criteria
//   */
//  ActiveFinder.prototype.count = function(criteria)
//  {
//    yii::trace(get_class(this._join_tree.model).'.count() eagerly','system.db.ar.cactive_record');
//    this.join_all=criteria.together!==true;
//
//    alias=criteria.alias===null ? 't' : criteria.alias;
//    this._join_tree.table_alias=alias;
//    this._join_tree.raw_table_alias=this._builder.get_schema().quote_table_name(alias);
//
//    n=this._join_tree.count(criteria);
//    this.destroy_join_tree();
//    return n;
//  }

  ActiveFinder.prototype.lazy_find = function( base_record, callback ) {
    var self = this;

    this._join_tree.lazy_find( base_record, function( err ) {
      if ( err ) return callback( err );

      var child = Object.reset( self._join_tree.children );
      if( child ) {
        child.after_find();
      }

//    this.destroy_join_tree();

      callback();
    } );
  }

//  ActiveFinder.prototype._destroy_join_tree = function()
//  {
//    if(this._join_tree!==null)
//      this._join_tree.destroy();
//    this._join_tree=null;
//  }
//

ActiveFinder.prototype._build_join_tree = function( parent, With, options ) {
  options = options || null;

  if( parent instanceof StatElement ) throw new Error(
    'The stat relation `%s` cannot have child relations.'.format( parent.relation.name )
  );

  if( typeof With == "string" ) {

    var pos = With.lastIndexOf( '.' );
    if( ~pos ) {
      parent = this._build_join_tree( parent, With.substr( 0, pos ) );
      With   = With.substr( pos + 1 );
    }

//    // named scope
//    if((pos=strpos(With,':'))!==false)
//    {
//      scopes=explode(':',substr(With,pos+1));
//      With=substr(With,0,pos);
//    }

    if( parent.children[ With ] ) return parent.children[ With ];

    var relation = parent.model.get_relations()[ With ];
    if( !relation ) throw new Error(
      'relation `%s` is not defined in active record class %s.'.format( With, parent.model.class_name )
    );

    relation = relation.copy();

    var model = relation.model;
    var old_alias;

    if( relation instanceof ActiveRelation ) {
      old_alias = model.get_table_alias( false/*, false*/ );
      model.set_table_alias( relation.alias || relation.name );
    }

//    if((scope=model.default_scope())!==array())
//      relation.merge_With(scope,true);
//
//    if(!empty(scopes))
//    {
//      scs=model.scopes();
//      foreach(scopes as scope)
//      {
//        if(isset(scs[scope]))
//          relation.merge_With(scs[scope],true);
//        else
//          throw new cdb_exception(yii::t('yii','active record class "{class}" does not have a scope named "{scope}".',
//            array('{class}'=>get_class(model), '{scope}'=>scope)));
//      }
//    }

    // dynamic options
    if( options ) relation.merge_with( options );

    if( relation instanceof ActiveRelation ) model.set_table_alias( old_alias );

    if( relation instanceof StatRelation ) return new StatElement( {
      finder    : this,
      relation  : relation,
      parent    : parent
    } );

    var element = parent.children[ With ] = new JoinElement( {
      app         : this.app,
      finder      : this,
      relation    : relation,
      parent      : parent,
      join_count  : ++this._join_count
    });

    if( !Object.isEmpty( relation.With ) )
      this._build_join_tree( element, relation.With );

    return element;
  }

  // With is an object, keys are relation name, values are relation spec
  for ( var key in With ) {
    var value = With[ key ];

    if( typeof value == 'string' )  // the value is a relation name
      this._build_join_tree( parent, value );
    else if( Object.isObject( value ) )
      this._build_join_tree( parent, key, value );
  }
}




