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

    password  : ['required', {
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


Model4.prototype.forced_save = function( callback, attributes ){
  var emitter = new process.EventEmitter;
  var self    = this;

  var fields        = this.get_attributes_names( attributes );
  var replacements  = fields.map(function( field ){
    return ':' + field;
  });

  // INSERT INTO users (username, password, email) VALUES (:username, :password, :email)
  var sql = 'INSERT INTO users ({fields}) VALUES ({replacements})'.format({
    '{fields}'       : fields.join(', '),
    '{replacements}' : replacements.join(', ')
  });

  this.app.db.create_command( sql ).bind_values( this.get_attributes( attributes ) )
    .execute( function(e, result){

      emitter.emit( e ? 'error' : 'success', e || self );
      callback && callback( e, self );
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

      user.set_attributes( attributes, false, true );
      users.push( user );
    });

    callback( null, users );
  });
}