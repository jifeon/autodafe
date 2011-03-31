var default_proxy_handler = new function() {
  // Object.getOwnPropertyDescriptor(proxy, name) -> pd | undefined
  this.getOwnPropertyDescriptor = function(name) {
    var desc = Object.getOwnPropertyDescriptor(this, name);
    if (desc !== undefined) { desc.configurable = true; }
    return desc;
  }

  // Object.getPropertyDescriptor(proxy, name) -> pd | undefined
  this.getPropertyDescriptor = function(name) {
    // Note = this function does not exist in ES5
    // var desc = Object.getPropertyDescriptor(this, name);
    // fall back on manual prototype-chain-walk =
    var desc = Object.getOwnPropertyDescriptor(this, name);
    var parent = Object.getPrototypeOf(this);
    while (desc === undefined && parent !== null) {
      desc = Object.getOwnPropertyDescriptor(parent, name);
      parent = Object.getPrototypeOf(parent);
    }
    if (desc !== undefined) { desc.configurable = true; }
    return desc;
  }

  // Object.getOwnPropertyNames(proxy) -> [ string ]
  this.getOwnPropertyNames = function() {
    return Object.getOwnPropertyNames(this);
  }

  // Object.getPropertyNames(proxy) -> [ string ]
  this.getPropertyNames = function() {
    // Note = this function does not exist in ES5
    // return Object.getPropertyNames(this);
    // fall back on manual prototype-chain-walk =
    var props = Object.getOwnPropertyNames(this);
    var parent = Object.getPrototypeOf(this);
    while (parent !== null) {
      props = props.concat(Object.getOwnPropertyNames(parent));
      parent = Object.getPrototypeOf(parent);
    }
    // FIXME = remove duplicates from props
    return props;
  }

  // Object.defineProperty(proxy, name, pd) -> undefined
  this.defineProperty = function(name, desc) {
    return Object.defineProperty(this, name, desc);
  }

  // delete proxy[name] -> boolean
  this['delete'] = function(name) {
    return delete this[name]; 
  }

  // Object.{freeze|seal|preventExtensions}(proxy) -> proxy
  this.fix = function() {
    // As long as target is not frozen, the proxy won't allow itself to be fixed
    if (!Object.isFrozen(this))
      return undefined;
    var props = {};
    for (var name in this) {
            props[x] = Object.getOwnPropertyDescriptor(this, name);
    }
    return props;
  }

  // name in proxy -> boolean
  this.has = function(name) { return name in this; }

  // ({}).hasOwnProperty.call(proxy, name) -> boolean
  this.hasOwn = function(name) { return ({}).hasOwnProperty.call(this, name); }

  // proxy[name] -> any
  this.get = function(receiver, name) {
    return this[name];
  }

  // proxy[name] = val -> val
  this.set = function(receiver, name, val) {
    this[name] = val;
    // bad behavior when set fails in non-strict mode
    return true;
  }

  // for (var name in Object.create(proxy)) { ... }
  this.enumerate = function() {
    var result = [];
    for (var name in this) { result.push(name); };
    return result;
  }

  // for (var name in proxy) { ... }
  // Note = non-standard trap
  this.iterate = function() {
    var props = this.enumerate();
    var i = 0;
    return {
      next : function() {
        if (i === props.length) throw StopIteration;
        return props[i++];
      }
    };
  }

  // Object.keys(proxy) -> [ string ]
  this.keys = function() { return Object.keys(this); }
}

var Proxy = require( './node-proxy/lib/node-proxy' );

// monkey-patch Proxy.Handler if it's not defined yet
//if ( typeof Proxy === "object" && !Proxy.Handler ) {
//  Proxy.Handler = DefaultProxyHandler;
//}
//module.exports = DefaultProxyHandler;


function handlerMaker(obj, target) {
  return {
    // Fundamental traps
    getOwnPropertyDescriptor: function(name) {
      var desc = Object.getOwnPropertyDescriptor(obj, name);
      // a trapping proxy's properties must always be configurable
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    getPropertyDescriptor:  function(name) {
      var desc = Object.getPropertyDescriptor(obj, name); // not in ES5
      // a trapping proxy's properties must always be configurable
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    getOwnPropertyNames: function() {
      return Object.getOwnPropertyNames(obj);
    },
    getPropertyNames: function() {
      return Object.getPropertyNames(obj);                // not in ES5
    },
    defineProperty: function(name, desc) {
      Object.defineProperty(obj, name, desc);
    },
    'delete':       function(name) { return delete obj[name]; },
    fix:          function() {
      if (Object.isFrozen(obj)) {
        return Object.getOwnPropertyNames(obj).map(function(name) {
          return Object.getOwnPropertyDescriptor(obj, name);
        });
      }
      // As long as obj is not frozen, the proxy won't allow itself to be fixed
      return undefined; // will cause a TypeError to be thrown
    },

    // derived traps
    has:          function(name) { return name in obj; },
    hasOwn:       function(name) { return Object.prototype.hasOwnProperty.call(obj, name); },
    get:          function(receiver, name) {
      console.log(name);
      return typeof obj[name] == "function" ? function() {
        obj[name].call( target, arguments )
      } : obj[name];
    },
    set:          function(receiver, name, val) { obj[name] = val; return true; }, // bad behavior when set fails in non-strict mode
    enumerate:    function() {
      var result = [];
      for (name in obj) { result.push(name); };
      return result;
    },
    keys: function() { return Object.keys(obj) }
  };
}

var a = { d : 5 }
var handler = Proxy.create( handlerMaker( default_proxy_handler, a ) );

//
//DefaultProxyHandler.wrap = function( obj ) {
//  return Proxy.create(
//    handler,
//    Object.getPrototypeOf( obj )
//  );
//};
//
//
//DefaultProxyHandler.wrap_function = function( call, construct ) {
//  return Proxy.createFunction(
//    new this,
//    call,
//    construct || call
//  );
//};





var b = Proxy.create( handler, Object.getPrototypeOf( a ) );
console.log( b.d );