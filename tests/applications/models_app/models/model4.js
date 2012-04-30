module.exports = Model4.inherits( autodafe.Model );

function Model4( params ) {
  this._init( params );

  this.guest = params.guest;
}


Model4.prototype.attributes = function( params ) {
  return {
    username : {
      safe         : true,
      required     : true,
      range_length : [4, 20],
      errors       : {
        required : '{field} required'
      }},

    password  : ['safe required', {
      min_length : 6,
      errors     : {
        min_length : 'Field {field} should have {length} ch.'
      }
    }],
    email     : {
      'safe required email' : true,
      errors : {
        email : 'Please enter email instead of "{value}"'
      }
    }
  };
};


Model4.prototype.forced_save = function( callback ){
  callback = callback || this.default_callback;

  var emitter = new process.EventEmitter;
  var self    = this;
  this.app.db
  .create_command('INSERT INTO users (username, password, email) VALUES (:username, :password, :email)')
  .bind_values( this.get_attributes() )
  .execute( function(e, result){

    emitter.emit( e ? 'error' : 'success', e || self );
    return callback( e, self );
  } );

  return emitter;
}


Model4.prototype.find_all = function( callback ){
  var self = this;
  this.app.db
  .create_command('SELECT * FROM users')
  .execute( function(e, result){
    if (e) return callback(e);

    var users = [];
    result.fetch_obj(function( attributes ){
      var user = new self.models.model4;

      user.set_attributes( attributes, true, false );
      users.push( user );
    });

    callback( null, users );
  });
}