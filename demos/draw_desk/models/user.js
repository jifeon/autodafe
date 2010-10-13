var ActiveRecord   = require('ar/active_record');

var User = module.exports = function( params ) {
  this._init( params );
};


User.get_table_name = function () {
  return 'user';
};


User.model = function() {
  return ActiveRecord.model( this );
};


require('sys').inherits( User, ActiveRecord );


User.prototype._init = function ( params ) {
  ActiveRecord.prototype._init.call( this, params );
};