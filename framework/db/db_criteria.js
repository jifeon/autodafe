module.exports = DBCriteria;

function DBCriteria( params ) {
  this._init( params );
}


DBCriteria.prototype._init = function( params ) {
  this.select     = '*';
  this.distinct   = false;
  this.condition  = '';
  this.params     = {};
  this.limit      = -1;
  this.offset     = -1;
  this.order      = '';
  this.group      = '';
  this.join       = '';
  this.having     = '';
  this.alias      = '';

  for ( var param in params ) {
    this[ param ] = params[ param ];
  }
};

DBCriteria.prototype.merge_with = function( criteria, use_and ) {
  var and = use_and || use_and == undefined ? 'AND' : 'OR';

  if ( criteria instanceof Object ) criteria = new this.constructor( criteria );
  if ( this.select !== criteria.select ) {
    if ( this.select == '*' )
      this.select = criteria.select;
    else if ( criteria.select != '*' ) {
      var select1 = typeof this.select == "string"      ? this.select.replace( /\s/g, '' ).split(',')     : this.select;
      var select2 = typeof criteria.select == "string"  ? criteria.select.replace( /\s/g, '' ).split(',') : criteria.select;
      this.select = select1.merge( select2 );
    }
  }

  if ( this.condition !== criteria.condition ) {
    if ( this.condition === '' )
      this.condition = criteria.condition;
    else if ( criteria.condition !== '' )
      this.condition = "({this.condition}) " + and + " ({criteria.condition})";
  }

  if ( this.params !== criteria.params )
    this.params = Object.merge( this.params, criteria.params );

  if ( criteria.limit > 0 )
    this.limit = criteria.limit;

  if ( criteria.offset >= 0 )
    this.offset = criteria.offset;

  if ( criteria.alias !== null )
    this.alias = criteria.alias;

  if ( this.order !== criteria.order ) {
    if ( this.order === '' )
      this.order = criteria.order;
    else if ( criteria.order !== '' )
      this.order = criteria.order + ', ' + this.order;
  }

  if ( this.group !== criteria.group ) {
    if ( this.group === '' )
      this.group = criteria.group;
    else if ( criteria.group !== '' )
      this.group += ', ' + criteria.group;
  }

  if ( this.join !== criteria.join ) {
    if ( this.join === '' )
      this.join = criteria.join;
    else if ( criteria.join !== '' )
      this.join += ' ' + criteria.join;
  }

  if ( this.having !== criteria.having ) {
    if ( this.having === '' )
      this.having = criteria.having;
    else if ( criteria.having !== '' )
      this.having = "(" + this.having + ") " + and + " (" + criteria.having + ")";
  }

  if ( criteria.distinct > 0 )
    this.distinct = criteria.distinct;
}