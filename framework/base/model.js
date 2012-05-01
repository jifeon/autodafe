var crypto    = require( 'crypto' );

module.exports = Model.inherits( autodafe.AppModule );

/**
 *
 * @param params
 * @constructor
 * @extends AppModule
 */
function Model( params ) {
  this._init( params );
}


Model.prototype.native_filters = {
  md5 : function( v ){
    return crypto.createHash('md5').update( v ).digest("hex");
  },
  trim : function( v ){
    return typeof v == 'string' ? v.trim() : v;
  }
}


Model.prototype._init = function ( params ) {
  Model.parent._init.call( this, params );

  this._errors      = {};
  this._attributes  = [];
  this._keys        = [];

  this.models       = this.app.models;
  this.is_inited    = true;

  this._process_attributes();
};


Model.prototype._process_attributes = function(){
  var descriptions = this.app.tools.to_object( this.attributes(), 1 );

  for ( var attr in descriptions ) {
    this.create_attribute( attr, descriptions[attr] );
  }
};


Model.prototype.attributes = function(){
  return {};
};


Model.prototype.get_attributes_names = function( names ){
  if ( typeof names == 'string' ) names = names.split(/\s*,\s*/);
  if ( !Array.isArray( names ) )  return this._attributes.slice(0);

  return names.filter( this.is_attribute.bind( this ) );
};


Model.prototype.is_attribute = function( attr ){
  return !!~this._attributes.indexOf( attr );
};


Model.prototype.create_attribute = function( attr, description ){
  if ( !description ) return false;

  this._[ attr ].get = function( descriptor ){
    return this.get_attribute( descriptor.name );
  }

  this._[ attr ].set = function( value, descriptor ){
    this.set_attribute( descriptor.name, value );
  }

  description = this.app.tools.to_object( description, 1 );

  // check for safe attribute, alternative errors and filters
  [ 'safe', 'errors', 'prefilters', 'postfilters' ].forEach(function( rule ){
    if ( description[ rule ] ) {
      this._[ attr ].params[ rule ] = description[ rule ];
      delete description[ rule ];
    }
  }, this);

  if ( description['key'] ) {
    this._keys.push( attr );
    delete description['key'];
  }

  this._[ attr ].params.validation_rules = description;
  this._attributes.push( attr );
};


Model.prototype.remove_attribute = function( attr ){
  if ( !this.is_attribute( attr ) ) return this;

  delete this._errors[ attr ];
  this._attributes.splice( this._attributes.indexOf( attr ), 1 );
  this._keys.splice( this._keys.indexOf( attr ), 1 );
  delete this._[ attr ];

  return this;
};


Model.prototype.get_attribute = function ( name, do_filters ) {
  if ( !this.is_attribute( name ) ) return undefined;

  var descriptor = this._[name];
  var value      = descriptor.value;
  if ( do_filters !== false ) value = this.filter( descriptor.value, descriptor.params['postfilters'] );
  return value === undefined ? null : value;
};


Model.prototype.get_attributes = function( names, do_filters ) {
  if ( typeof names == 'string' ) names = names.split(/\s*,\s*/);
  if ( !Array.isArray( names ) )  names = this._attributes;

  var attrs = {};

  names.forEach( function( name ){
    attrs[ name ] = this.get_attribute( name, do_filters );
  }, this );

  return attrs;
};


Model.prototype.set_attribute = function ( name, value, do_filters ) {
  if ( !this.is_attribute( name ) ) return this;

  var descriptor = this._[name];
  descriptor.value = do_filters !== false
    ? this.filter( value, descriptor.params['prefilters'] )
    : value;

  return this;
};


Model.prototype.set_attributes = function ( attributes, do_filters, forced ) {
  if ( !Object.isObject( attributes ) ) {
    this.l( 'First argument to `%s.set_attributes` should be an Object'.format( this.class_name ), 'warning' );
    return this;
  }

  for ( var attr in attributes ) {
    if ( forced || this.is_safe_attribute( attr ) )
      this.set_attribute( attr, attributes[ attr ], do_filters );
    else
      this.log( '`%s.set_attributes` try to set the unsafe attribute `%s`'.format( this.class_name, attr ), 'warning' );
  }

  return this;
};


Model.prototype.clean_attributes = function ( names ) {
  if ( typeof names == 'string' ) names = names.split(/\s*,\s*/);
  if ( !Array.isArray( names ) )  names = this._attributes;

  names.forEach(function( attr ){
    this[attr] = null;
  }, this);

  return this;
};


Model.prototype.filter = function( value, filters ){
  if ( !filters ) return value;
  if ( !Array.isArray( filters ) ) filters = [filters];
  filters.forEach(function( filter ){
    if ( typeof filter == 'string'   ) filter = this.native_filters[ filter ];
    if ( typeof filter == 'function' ) value = filter( value );
  }, this);

  return value;
};


Model.prototype.is_safe_attribute = function( name ){
  return this.is_attribute( name ) && !!this._[ name ].params['safe'];
};


Model.prototype.is_key_attribute = function( name ){
  return !!~this._keys.indexOf( name );
};


Model.prototype.save = function ( callback, attributes ) {
  var emitter = new process.EventEmitter;
  var self    = this;

  this.validate(function( e ){
    if ( e ) return callback && callback( e );
    if ( self.has_errors() ) return callback && callback( null, self );

    self.forced_save( callback, attributes ).re_emit( 'error', 'success', emitter );
  }).re_emit( 'error', 'not_valid', emitter );

  return emitter;
};


Model.prototype.forced_save = function( callback, attributes ){
  var self    = this;
  var emitter = new process.EventEmitter;

  process.nextTick(function(){
    callback && callback( null );
    emitter.emit( 'success', self );
  });

  return emitter;
};


Model.prototype.remove = function ( callback ) {
  var self    = this;
  var emitter = new process.EventEmitter;

  process.nextTick(function(){
    callback && callback( null );
    emitter.emit( 'success', self );
  });

  return emitter;
};


Model.prototype.validate = function ( callback, attributes ){
  if ( typeof attributes == 'string' ) attributes = attributes.split(/\s*,\s*/);
  if ( !Array.isArray( attributes ) )  attributes = this._attributes;

  this._errors = {};

  var self     = this;
  var emitter  = new process.EventEmitter;

  var listener = this.app.tools.create_async_listener( attributes.length, function( result ){
    callback && callback( result.error || null, !self.has_errors() );

    if ( result.error )      emitter.emit( 'error',     result.error );
    if ( self.has_errors() ) emitter.emit( 'not_valid', self.get_errors() );
    else                     emitter.emit( 'success',   self );
  });

  attributes.forEach( function( attr ){
    this.validate_attribute( attr, listener.listen( 'error' ) );
  }, this );

  return emitter;
}


Model.prototype.validate_attribute = function( name, callback ){
  var rules   = this._[name].params.validation_rules;
  var errors  = this._[name].params.errors || {};

  for ( var rule in rules ) {
    if ( typeof this.app.validator[ rule ] != 'function' )
      return callback( new Error(
        '`{rule}` is undefined rule in description of attribute `{model}.{attr}`'.format({
          '{rule}'  : rule,
          '{model}' : this.class_name,
          '{attr}'  : name
        })
      ));

    var error = this.app.validator[ rule ](
      name,
      this.get_attribute( name, false ),
      rules[ rule ],
      errors[ rule ] );

    if ( error ) this._errors[ name ] = error;
  }

  callback();
};


Model.prototype.has_errors = function () {
  return !!Object.keys( this._errors ).length;
}


Model.prototype.get_errors = function(){
  return this._errors;
}


Model.prototype.equals = function ( model ) {
  if ( this.constructor != model.constructor ) return false;

  if ( !this._keys.length ) {
    this.log( 'Model `%s` does not have keys, so it can\'t be compared'.format( this.class_name ), 'warning' );
    return false;
  }

  for ( var i = 0, i_ln = this._keys.length; i < i_ln; i++ ) {
    var key = this._keys[i];
    if ( this[key] != model[key] ) return false;
  }

  return true;
};


Model.prototype.get_id = function(){
  switch ( this._keys.length ) {
    case 0:
      return null;

    case 1:
      return this[ this._keys[0] ];

    default:
      var result = {};
      this._keys.forEach( function( key ){
        result[ key ] = this[ key ];
      }, this );
      return result;
  }
};


//Model.prototype._check_for_cloning_description = function( description ){
//  for ( var rule in description ) {
//
//    var clone_from = null;
//    if ( rule == 'clone' ) clone_from = description[ rule ];   // { clone : 'user.email' }
//    if ( !clone_from )     clone_from = rule;                  // { 'user.email' : true }
//
//    var matches = /(\w+)\.(\w+)/.exec( clone_from );           // 1st pocket - model, 2 - attribute for clone
//    if ( !matches ) continue;
//
//    var model = this.models[ matches[1] ];
//    if ( !model ) {
//      this.log( 'Model `%s` for cloning attribute `%s` is not found'.format( matches[1], matches[2] ), 'warning' );
//      continue;
//    }
//
//    var cloned_description = model.get_attributes_description()[ matches[2] ];
//    if ( !cloned_description ) {
//      this.log( 'Description for attribute `%s` in model `%s` is not found'.format( matches[2], matches[1] ), 'warning' );
//      continue;
//    }
//
//    for ( var cloned_rule in cloned_description )
//      description[ cloned_rule ] = cloned_description[ cloned_rule ];
//
//    delete description[ rule ];
//    break;
//  }
//};
