// Copyright (C) 2010-2011 Software Languages Lab, Vrije Universiteit Brussel
// This code is dual-licensed under both the Apache License and the MPL

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is a default forwarding handler for Harmony Proxies.
 *
 * The Initial Developer of the Original Code is
 * Tom Van Cutsem, Vrije Universiteit Brussel.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 */

// A no-op forwarding Proxy Handler
// based on the draft version for standardization:
// http://wiki.ecmascript.org/doku.php?id=harmony:proxy_defaulthandler
module.exports = ProxyHandler;

var Proxy = require( 'node-proxy' );

function ProxyHandler( params ) {
  this._init( params );
}


ProxyHandler.prototype._init = function ( params ) {
  params      = params        || {};
  var target  = params.target || {}
  Object.defineProperty( this, 'target', {
    get : function(){ return target; }
  } );
  this._proxy = null;
};


// Object.getOwnPropertyDescriptor(proxy, name) -> pd | undefined
ProxyHandler.prototype.getOwnPropertyDescriptor = function( name ) {
  var desc = Object.getOwnPropertyDescriptor( this.target, name );
  if ( desc !== undefined ) {
    desc.configurable = true;
  }
  return desc;
}


// Object.getPropertyDescriptor(proxy, name) -> pd | undefined
ProxyHandler.prototype.getPropertyDescriptor = function( name ) {

  // Note = this function does not exist in ES5
  // var desc = Object.getPropertyDescriptor(this.target, name);
  // fall back on manual prototype-chain-walk:
  var desc    = Object.getOwnPropertyDescriptor( this.target, name );
  var parent  = Object.getPrototypeOf( this.target );

  while ( desc === undefined && parent !== null ) {
    desc = Object.getOwnPropertyDescriptor( parent, name );
    parent = Object.getPrototypeOf( parent );
  }
  if ( desc !== undefined ) {
    desc.configurable = true;
  }
  return desc;
}


// Object.getOwnPropertyNames(proxy) -> [ string ]
ProxyHandler.prototype.getOwnPropertyNames = function() {
  return Object.getOwnPropertyNames( this.target );
}


// Object.getPropertyNames(proxy) -> [ string ]
ProxyHandler.prototype.getPropertyNames = function() {

  // Note: this function does not exist in ES5
  // return Object.getPropertyNames(this.target);
  // fall back on manual prototype-chain-walk:
  var props   = Object.getOwnPropertyNames( this.target );
  var parent  = Object.getPrototypeOf( this.target );

  while ( parent !== null ) {
    props = props.concat( Object.getOwnPropertyNames( parent ) );
    parent = Object.getPrototypeOf( parent );
  }
  // FIXME: remove duplicates from props
  return props;
}


// Object.defineProperty(proxy, name, pd) -> undefined
ProxyHandler.prototype.defineProperty = function( name, desc ) {
  return Object.defineProperty( this.target, name, desc );
}


// delete proxy[name] -> boolean
ProxyHandler.prototype['delete'] = function( name ) {
  return delete this.target[ name ];
}


// Object.{freeze|seal|preventExtensions}(proxy) -> proxy
ProxyHandler.prototype.fix = function() {
  // As long as target is not frozen, the proxy won't allow itself to be fixed
  if ( !Object.isFrozen( this.target ) ) return undefined;

  var props = {};
  for ( var name in this.target ) {
    props[ name ] = Object.getOwnPropertyDescriptor( this.target, name );
  }

  return props;
}


// name in proxy -> boolean
ProxyHandler.prototype.has = function( name ) {
  return name in this.target;
}


// ({}).hasOwnProperty.call(proxy, name) -> boolean
ProxyHandler.prototype.hasOwn = function( name ) {
  return ({}).hasOwnProperty.call( this.target, name );
}


// proxy[name] -> any
ProxyHandler.prototype.get = function( receiver, name ) {
  var self = this;

  return typeof this.target[ name ] != 'function'
    ? this.target[ name ]
    : function() {
      return self.target[ name ].apply( self.target, arguments );
    };
}


// proxy[name] = val -> val
ProxyHandler.prototype.set = function( receiver, name, val ) {
  this.target[ name ] = val;
// bad behavior when set fails in non-strict mode
  return true;
}


// for (var name in Object.create(proxy)) { ... }
ProxyHandler.prototype.enumerate = function() {
  var result = [];
  for ( var name in this.target ) {
    result.push( name );
  }

  return result;
}


// for (var name in proxy) { ... }
// Note: non-standard trap
ProxyHandler.prototype.iterate = function() {
  var props = this.enumerate();
  var i = 0;
  return {
    next: function() {
      if ( i === props.length ) throw StopIteration;
      return props[i++];
    }
  };
}


// Object.keys(proxy) -> [ string ]
ProxyHandler.prototype.keys = function() {
  return Object.keys( this.target );
}


ProxyHandler.prototype.get_proxy = function () {
  if ( !this._proxy )
    this._proxy = Proxy.create( this, Object.getPrototypeOf( this.target ) );

  return this._proxy;
};