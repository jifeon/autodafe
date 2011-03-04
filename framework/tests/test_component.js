/**
 * Created by JetBrains PhpStorm.
 * User: jifeon
 * Date: 01.03.11
 * Time: 22:01
 * To change this template use File | Settings | File Templates.
 */
var Component = require('components/component');
var Tests = module.exports = function( params ) {
  this._init( params );
};

require('sys').inherits( Tests, Component );


Tests.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );

  this.vows       = require('./vows/lib/vows');
  this.directory  = params.directory || false;
  this.files      = params.files || [];
}
