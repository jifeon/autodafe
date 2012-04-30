var ActiveRecord = global.autodafe.db.ActiveRecord;

module.exports = User.inherits( ActiveRecord );

function User( params ) {
  this._init( params );
}

User.prototype.get_table_name = function(){
  return 'users';
}


User.prototype.attributes = function(){
  return {
    login : [
      'safe required',
      { range_length : [4, 30] }
    ],
    pass : 'safe required md5'
  };
}
