var Component = require('components/component');

module.exports = MyTools.inherits( Component );

function MyTools( params ) {
  this._init( params );
}


MyTools.prototype._init = function ( params ) {
  this.super_._init( params );

  this.app.tools.dust.filters.local_date = function( value ){
    if ( !( value instanceof Date ) ) return value;

    return value.toLocaleDateString();
  };

  this.app.tools.dust.filters.n2br = function( value ){
    return value.replace( /\n/g, '<br/>' );
  };
};