var Controller  = require( 'controller' );

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


SiteController.prototype.index = function ( params, client ) {
  var self = this;

  this.models.post.find_all({
    limit : 10,
    order : 'date'
  })
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( posts ){
      self.send_response( 'posts_list.html', client, {
        posts : posts,
        error : params && params.error instanceof Error ? params.error.message : ''
      } );
    } );
};


SiteController.prototype.register = function ( params, client ) {
  var self = this;
  this.models.user.exists( 'login=:login', {
    login : params.login
  } )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( user_exists ) {
      if( user_exists ) return this.index( {
        error : new Error('This login already in use')
      }, client );

      var user = new self.models.user;
      user.set_attributes( params );

      user.save()
        .on( 'error', client.send_error.bind( client ) )
        .on( 'validation_error', function( errors ){
          self.index( {
            error : new Error( errors.join('<br/>') )
          }, client );
        } )

        .on( 'success', function(  ) {
          self._login_client( client, user );
          self.index( null, client );
        } );
    } );
};


SiteController.prototype.login = function ( params, client ) {
  var self = this;

  this.models.user.find_by_attributes( {
    login : params.login,
    pass  : params.pass
  } )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( user ){
      if ( !user ) return self.index( {
        error : new Error('Wrong email or/and password')
      }, client );

      self._login_client( client, user );
      self.index( null, client );
    } );
};


SiteController.prototype._login_client = function ( client, user ) {
  this.app.users.authorize_session( client.session, user );

  client.set_cookie( 'blog_email',  user.login, 365 );
  client.set_cookie( 'blog_pass',   user.pass,  365 );
};


SiteController.prototype._logout_client = function ( client ) {
  this.app.users.logout_session( client.session );

  client.set_cookie( 'blog_email',  '' );
  client.set_cookie( 'blog_pass',   '' );
};