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

function ForwardingHandler( this_target ) {
  return {
    // Object.getOwnPropertyDescriptor(proxy, name) -> pd | undefined
    getOwnPropertyDescriptor: function(name) {
      var desc = Object.getOwnPropertyDescriptor(this_target, name);
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
  
    // Object.getPropertyDescriptor(proxy, name) -> pd | undefined
    getPropertyDescriptor: function(name) {
      // Note: this function does not exist in ES5
      // var desc = Object.getPropertyDescriptor(this_target, name);
      // fall back on manual prototype-chain-walk:
      var desc = Object.getOwnPropertyDescriptor(this_target, name);
      var parent = Object.getPrototypeOf(this_target);
      while (desc === undefined && parent !== null) {
        desc = Object.getOwnPropertyDescriptor(parent, name);
        parent = Object.getPrototypeOf(parent);
      }
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
  
    // Object.getOwnPropertyNames(proxy) -> [ string ]
    getOwnPropertyNames: function() {
      return Object.getOwnPropertyNames(this_target);
    },
  
    // Object.getPropertyNames(proxy) -> [ string ]
    getPropertyNames: function() {
      // Note: this function does not exist in ES5
      // return Object.getPropertyNames(this_target);
      // fall back on manual prototype-chain-walk:
      var props = Object.getOwnPropertyNames(this_target);
      var parent = Object.getPrototypeOf(this_target);
      while (parent !== null) {
        props = props.concat(Object.getOwnPropertyNames(parent));
        parent = Object.getPrototypeOf(parent);
      }
      // FIXME: remove duplicates from props
      return props;
    },

    // Object.defineProperty(proxy, name, pd) -> undefined
    defineProperty: function(name, desc) {
      return Object.defineProperty(this_target, name, desc);
    },

    // delete proxy[name] -> boolean
    'delete': function(name) { return delete this_target[name]; },

    // Object.{freeze|seal|preventExtensions}(proxy) -> proxy
    fix: function() {
      // As long as target is not frozen, the proxy won't allow itself to be fixed
      if (!Object.isFrozen(this_target))
        return undefined;
      var props = {};
      for (var name in this_target) {
              props[x] = Object.getOwnPropertyDescriptor(this_target, name);
      }
      return props;
    },

    // name in proxy -> boolean
    has: function(name) { return name in this_target; },

    // ({}).hasOwnProperty.call(proxy, name) -> boolean
    hasOwn: function(name) { return ({}).hasOwnProperty.call(this_target, name); },

    // proxy[name] -> any
    get: function(receiver, name) {
      return this_target[name];
    },

    // proxy[name] = val -> val
    set: function(receiver, name, val) {
      this_target[name] = val;
      // bad behavior when set fails in non-strict mode
      return true;
    },

    // for (var name in Object.create(proxy)) { ... }
    enumerate: function() {
      var result = [];
      for (name in this_target) { result.push(name); };
      return result;
    },

    // for (var name in proxy) { ... }
    // Note: non-standard trap
    iterate: function() {
      var props = this.enumerate();
      var i = 0;
      return {
        next: function() {
          if (i === props.length) throw StopIteration;
          return props[i++];
        }
      };
    },

    // Object.keys(proxy) -> [ string ]
    keys: function() { return Object.keys(this_target); }
  }
}

var Proxy = require( './node-proxy/lib/node-proxy' );

// monkey-patch Proxy.Handler if it's not defined yet
if ( typeof Proxy === "object" && !Proxy.Handler ) {
  Proxy.Handler = ForwardingHandler;
}
module.exports = ForwardingHandler;


ForwardingHandler.wrap = function( obj ) {
  return Proxy.create(
    new this( obj ),
    Object.getPrototypeOf( obj )
  );
};


ForwardingHandler.wrap_function = function( call, construct ) {
  return Proxy.createFunction(
    new this,
    call,
    construct || call
  );
};