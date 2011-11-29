var ActiveRecord = require( 'db/ar/active_record' );

module.exports = User.inherits( ActiveRecord );

function User( params ) {
  this._init( params );
}

User.prototype.get_table_name = function(){
  return 'users';
}


User.prototype.get_safe_attributes_names = function () {
  return ['login', 'pass'];
};


User.prototype.attributes_description = function(){
  return {
    login : [
      'required',
      { 'lesser'  : 30,
        'greater' : 4 }
    ],
    pass : [
      'required',
      'md5'
    ]
  };
}
