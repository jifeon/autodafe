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
    login : {
     'safe required' : true,
      range_length   : [4, 30],
      prefilters     : 'trim' },

    pass : {
     'safe required' : true,
      postfilters    : 'md5' }
  };
}


User.prototype.cookie_hash = function(){
  return this.pass.md5();
}