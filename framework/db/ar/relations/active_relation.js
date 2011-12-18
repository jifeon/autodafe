var BaseActiveRelation = require('./base_active_relation');

module.exports = ActiveRelation.inherits( BaseActiveRelation );

function ActiveRelation( params ) {
  this._init( params );
}


ActiveRelation.prototype._init = function( params ) {
  this.join_type = 'LEFT OUTER JOIN';
  this.on        = '';
  this.alias     = null;
  this.With      = {};
  this.together  = null;

  ActiveRelation.parent._init.call( this, params );
};


ActiveRelation.prototype.get_options = function () {
  var options = ActiveRelation.parent.get_options.call( this );

  options.join_type = this.join_type;
  options.on        = this.on;
  options.alias     = this.alias;
  options.With      = this.With;
  options.together  = this.together;

  return options;
};


ActiveRelation.prototype.merge_with = function ( criteria/*, from_scope*/ ) {
  
//  if(fromScope)
//    {
//      if(isset(criteria['condition']) && this.on!==criteria['condition'])
//      {
//        if(this.on==='')
//          this.on=criteria['condition'];
//        else if(criteria['condition']!=='')
//          this.on="({this.on}) AND ({criteria['condition']})";
//      }
//      unset(criteria['condition']);
//    }
  
  ActiveRelation.parent.merge_with.call( this, criteria );
  
  this.join_type = criteria.join_type || this.join_type;
  if ( criteria.on && this.on != criteria.on ) this.on = !this.on
    ? criteria.on
    : "(%s) AND (%S)".format( this.on, criteria.on );

  this.With     = criteria.With     || this.With;
  this.alias    = criteria.alias    || this.alias;
  this.together = criteria.together || this.together;
};