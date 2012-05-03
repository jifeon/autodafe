var Model = global.autodafe.Model;

module.exports = UITest.inherits( Model );

function UITest( params ) {
  this._init( params );

  this.set_attributes({
    p1 : 1,
    p2 : 2
  });
}

UITest.prototype.attributes = function(){
  return {
    'p1 p2' : 'safe'
  };
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
