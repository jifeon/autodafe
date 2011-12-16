var Component = require('components/component');
var dust   = require('dust');
var path      = require('path');
var fs        = require('fs');


module.exports = Pages.inherits( Component ); // наследуем от компонент

function Pages( params ) {
  this._init( params );
}

/**
 * Инициализация компонента
 *
 * @param {Object} params
 */
Pages.prototype._init = function ( params ) {
  // Вызов инициализации родительского класса
  this.super_._init( params );

  // массив объектов из которых генерятся ссылки на страницы
  this.links = [];

  // кол-во всех сущностей для вывода на страницу
  this.count = params.count || 0;

  // кол-во выводимое на каждой странице
  this.items_per_page = params.items_per_page || 10;

  // ссылка на страницу, которую должны вести ссылки
  this.link_to = params.link_to || '';

  // параметры для ссылки, которые вмесе с самой ссылкой будут попадать в функцию create_url
  this.link_params = params.link_params || { page : 1 };

  // контроллер у которого будет вызываться create_url, если не указан то использовать контроллер по умолчанию
  this.controller = params.controller ?
    this.app.router.get_controller( params.controller ) : this.app.router.get_controller( this.app.default_controller);

  //  ссылки выводятся в виде :
  // {left_block_count} .. {middle_block_count}{active_page}{middle_block_count} .. {right_block_count}

  this.left_block_count   = params.left_block_count || 2;
  this.middle_block_count = params.middle_block_count || 2;
  this.right_block_count  = params.right_block_count || 2;

  };

Pages.prototype.render = function( callback ){
  var links = [];
  var page = this.link_params.page;
  var links_count = Math.ceil( this.count/this.items_per_page );
  var full_view_count = this.left_block_count + 2*this.middle_block_count + this.right_block_count + 3;

  if( links_count < full_view_count ){
    for( var i = 1; i <= links_count; i++ ) this.add_link( i );
    return this.html( callback );
  }

  if( page < 2*this.middle_block_count + 2 ){
    for( var i = 1; i <= page + this.middle_block_count; i++ ) this.add_link( i );
    this.add_link( '..' );
    for( var i = links_count - this.right_block_count + 1; i <= links_count; i++ ) this.add_link( i );
    return this.html( callback );
  }

  if( page > links_count - 2*this.middle_block_count - 1 ){
    for( var i = 1; i <= this.left_block_count; i++ ) this.add_link( i );
    this.add_link( '..' );
    for( var i = page - this.middle_block_count; i <= links_count; i++ ) this.add_link( i );
    return this.html( callback );
  }

  for( var i = 1; i <= this.left_block_count; i++ ) this.add_link( i );
  this.add_link( '..' );
  for( var i = page - this.middle_block_count, ln = page + this.middle_block_count + 1; i <ln; i++ ) this.add_link( i );
  this.add_link( '..' );
  for( var i = links_count - this.right_block_count + 1; i <= links_count; i++ ) this.add_link( i );
  return this.html( callback );
};

Pages.prototype.add_link = function( i ){
    var link = {
      number  : i,
      active  : i == this.link_params.page,
      is_link : !isNaN( i ),
      url     : this.controller.create_url( this.link_to, { page : i } )
    };
    this.links.push( link )
};

Pages.prototype.html = function( callback ){
  var self = this;
  var template  = fs.readFileSync( path.join( __dirname, 'lib','pages.html' ), 'utf8' );
  var page  = dust.compile( template, 'pages' );
  dust.loadSource(page);
  dust.render( 'pages', {
    link_to : this.link_to,
    links   : this.links
  }, function( e, html ){
    callback.call( null, html );
  } );
};