var Controller  = require( 'controller' );
var User        = require( 'user' );

var ActionController = module.exports = function( params ) {
  this._init( params );
}

require('sys').inherits( ActionController, Controller );


ActionController.prototype.name     = 'action';
ActionController.prototype.actions  = [
  'login',
  'registration',
  'client_connect',
  'draw'
];


ActionController.prototype._init = function ( params ) {
  Controller.prototype._init.call( this, params );

  this.authorised_clients = {};
};


ActionController.prototype.login = function ( params, client ) {
  params = params || {};

  if ( !params.login || !params.pass ) return this.send_message( client, 'show_message', {
    message : 'Поля логин и пароль обязательны для ввода'
  } );

  var self = this;

  User.model()
    .find( 'login=:login and pass=:pass', {
      ':login'  : params.login,
      ':pass'   : params.pass
    } )
    .on( 'complete', function( user ) {
      if ( !user ) return self.send_message( client, 'show_message', {
        message : 'Пользователя с таким паролем не существует!'
      } );

      self.authorised_clients[ client.sessionId ] = true;
      self.send_message( client, 'login', 'user id: ' + user.id );
    } );
};


ActionController.prototype.registration = function ( params, client ) {
  params = params || {};

  if ( !params.login || !params.pass || !params.pass2 ) return this.send_message( client, 'show_message', {
    message : 'Поля пользователь, пароль и повторение пароля обязательны для ввода'
  } );

  var login = params.login;
  var pass  = params.pass;

  if ( !login || !pass || pass != params.pass2 ) return this.send_message( client, 'show_message', {
    message : 'Поля пользователь и пароль не должны быть пустыми, а также введенные пароли должны совпадать'
  } );

  var self = this;

  User.model()
    .find( 'login=:login', {
      ':login' : login
    } )
    .on( 'complete', function( user ) {
      if ( user ) return self.send_message( client, 'show_message', {
         message : 'Пользователь с таким логином уже существует'
      });

      self.registration_step2( client, login, pass );
    } );
};


ActionController.prototype.registration_step2 = function ( client, login, pass ) {
  var self = this;

  var user = new User;
  user.login  = login;
  user.pass   = pass;
  user.save().on( 'complete', function() {
    self.authorised_clients[ client.sessionId ] = true;
    self.send_message( client, 'login', 'user id: ' + user.id );
  } );
};


ActionController.prototype.client_connect = function ( client ) {
  this.emit( 'client_connect' );
};


ActionController.prototype.send_message = function ( client, action, params ) {
  params = params || null;

  var result = {
    action : action,
    params : params
  };

  client.send( JSON.stringify( result ) );
};


ActionController.prototype.draw = function ( params, client ) {
  if ( !this.authorised_clients[ client.sessionId ] ) return false;

  client.broadcast( JSON.stringify({
    action : 'draw',
    params : params
  }) );
};