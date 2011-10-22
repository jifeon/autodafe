var Model = require('model');

module.exports = UITest.inherits( Model );

function UITest( params ) {
  this._init( params );

  this.set_attributes({
    p1 : 1,
    p2 : 2
  });
}

UITest.prototype.get_safe_attributes_names = function(){
  return [ 'p1', 'p2' ];
}

UITest.user_rights = {
  guest   : [ 'view' ],
  role0   : [ 'view', 'edit' ],
  attributes : {
    p1 : {
      role1 : [ 'edit' ],
      role2 : [ 'view' ]
    }
  }
}
