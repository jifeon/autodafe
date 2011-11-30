var Controller  = require( 'controller' );
var crypto      = require('crypto');

module.exports = SiteController.inherits( Controller );

function SiteController( params ) {
  this._init( params );
}


SiteController.prototype.send_response = function ( view, client, params ) {
  params = params || {};

  var ui = this.app.users.get_by_client( client );
  if ( !ui.is_guest() ) params.user = ui.model;

  this.super_.send_response( view, client, params );
};


/**
 * Функция выполняется при подключении клиента, она авторизовывает пользователя по куки
 *
 * @param {Client} client подключенный клиент
 */
SiteController.prototype.connect_client = function ( client ){
  var ui = this.app.users.get_by_client( client );
  if ( !ui.is_guest() ) return true;

  var login = client.get_cookie( 'blog_login' );
  var pass  = client.get_cookie( 'blog_pass' );

  if ( !login || !pass ) return false;

  return this._authorize( login, pass, client );
};


SiteController.prototype.index = function ( params, client, error ) {
  var self = this;

  this.models.post.find_all({
    limit : 10,
    order : 'date desc'
  })
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( posts ){
      self.send_response( 'posts_list.html', client, {
        posts : posts,
        error : error ? error : ''
      } );
    } );
};


SiteController.prototype.register = function ( params, client ) {
  var self = this;
  params.pass = crypto.createHash('md5').update( params.pass ).digest("hex");

  this.models.user.exists( 'login=:login', {
    login : params.login
  } )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( user_exists ) {
      if( user_exists ) return self.index( null, client, 'This login already in use' );

      var user = new self.models.user;
      user.set_attributes( params );

      user.save()
        .on( 'error', client.send_error.bind( client ) )
        .on( 'validation_error', function( errors ){
          self.index( null, client, errors.join('<br/>') );
        } )

        .on( 'success', function(  ) {
          self._login_client( client, user );
          client.redirect( '/' );
        } );
    } );
};


SiteController.prototype.login = function ( params, client ) {
  var self = this;

  this._authorize(
    params.login,
    crypto.createHash('md5').update( params.pass ).digest("hex"),
    client,
    client.redirect.bind( client, '/' ),
    this.index.bind( this, null, client, 'Wrong email or/and password' )
  );
};


SiteController.prototype.logout = function ( params, client ) {
  this._logout_client( client );
  client.redirect( '/' );
};


SiteController.prototype._authorize = function ( login, pass, client, success, fail ) {
  var self = this;
  return this.models.user.find_by_attributes( {
    login : login,
    pass  : pass
  } )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( user ){
      if ( !user ) return typeof fail == 'function' && fail();

      self._login_client( client, user );
      typeof success == 'function' && success();
    } );
};


SiteController.prototype._login_client = function ( client, user ) {
  this.app.users.authorize_session( client.session, user );

  client.set_cookie( 'blog_login',  user.login, 365 );
  client.set_cookie( 'blog_pass',   user.pass,  365 );
};


SiteController.prototype._logout_client = function ( client ) {
  this.app.users.logout_session( client.session );

  client.set_cookie( 'blog_login',  '' );
  client.set_cookie( 'blog_pass',   '' );
};


SiteController.prototype.create_topic = function ( params, client ) {
  if ( params.name == null ) return this.send_response( 'new_post.html', client );

  var ui    = this.app.users.get_by_client( client );
  var self  = this;
  var post  = new this.models.post;
  post.set_attributes( params );
  post.user_id = ui.model.id;
  post.save()
    .on( 'error', client.send_error.bind( client ) )
    .on( 'validation_error', function( errors ){
      params.error = errors.join('<br/>');
      self.send_response( 'new_post.html', client, params );
    } )

    .on( 'success', function() {
      client.redirect( self.create_url( 'view_topic', { topic_id : post.id } ) );
    } );
};


SiteController.prototype.view_topic = function ( params, client ) {
  var self = this;
  this.models.post.With( 'author', 'comments.commenter' ).find_by_pk( params.topic_id )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( topic ){
      if ( !topic ) return client.send_error( 'Topic not found', 404 );

      self.send_response( 'topic.html', client, {
        topic : topic
      } );
    } );
};


SiteController.prototype.comment = function ( params, client ) {
  var ui    = this.app.users.get_by_client( client );
  var self  = this;

  this.models.post.find_by_pk( params.post_id )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( topic ){
      if ( !topic ) return client.send_error( 'Topic not found', 404 );

      var comment = new self.models.comment;
      comment.set_attributes( params );
      comment.post_id = topic.id;
      comment.user_id = ui.model.id;
      comment.save()
        .on( 'error', client.send_error.bind( client ) )
        .on( 'validation_error', function( errors ){
          self.send_response( 'topic.html', client, {
            topic : topic,
            error : errors.join('<br/>'),
            text  : params.text
          } );
        } )

        .on( 'success', function() {
          client.redirect( self.create_url( 'view_topic', { topic_id : topic.id } ) );
        } );
    } );
};