var crypto    = require( 'crypto' );

module.exports = Model.inherits( autodafe.AppModule );

function Model( params ) {
  this._init( params );
}


Model.prototype._init = function ( params ) {
  Model.parent._init.call( this, params );

  this._attributes          = {};
  this._safe_attributes     = null;
  this._attr_description    = null;
  this._errors              = {};
  this._alternative_errors  = {};
  this._filters             = {};

  this.models = this.app.models;

  this._.is_new    = params.is_new == undefined ? true : params.is_new;
  this._.is_inited = true;
};


Model.prototype.native_filters = {
  md5 : function( v ){
    return v && crypto.createHash('md5').update( v ).digest("hex");
  }
}


Model.prototype.attributes = function(){
  return {};
};


Model.prototype.set_attribute = function ( name, value ) {
  if ( this.hasOwnProperty( name ) ) this[ name ] = value;
  else this._attributes[ name ] = value;

  return this;
};


Model.prototype.get_attribute = function ( name ) {
  var attribute = this._attributes[ name ] != undefined ? this._attributes[ name ] : this[ name ];

  return typeof attribute == 'function' ? attribute.bind( this )  : attribute;
};


Model.prototype._clean_attributes = function () {
  this._attributes = {};
};


Model.prototype.get_attributes = function( names ) {
  if ( names instanceof Array ) {

    var attrs = {};

    names.forEach( function( name ){
      attrs[ name ] = this.get_attribute( name );
    }, this );

    return attrs;
  }
  else return Object.not_deep_clone( this._attributes );
};


Model.prototype.set_attributes = function ( attributes ) {
  if ( !Object.isObject( attributes ) ) {
    this.l( 'First argument to `%s.set_attributes` should be an Object'.format( this.class_name ), 'warning' );
    return this;
  }

  var attribute_names = this.get_safe_attributes_names();

  for ( var name in attributes ) {
    var filters = this._filters[ name ];
    if ( filters ) {
      if ( typeof filters == 'string'   ) filters = this.native_filters[ filters ];
      if ( typeof filters != 'function' ) filters = null;
    }

    if ( ~attribute_names.indexOf( name ) )
      this.set_attribute( name, filters ? filters( attributes[ name ] ) : attributes[ name ] );
    else {
      this.log( '%s.set_attributes try to set unsafe parameter "%s"'.format( this.class_name, name ), 'warning' );
      this.emit( 'set_unsafe_attribute', name, attributes[ name ] );
    }
  }

  return this;
};


Model.prototype.save = function ( attributes, scenario ) {
  scenario = scenario || this.is_new ? 'create' : 'update';

  return this.validate( null, scenario );
};


Model.prototype.remove = function () {
  return true;
};


Model.prototype.get_safe_attributes_names = function () {
  if ( !this._safe_attributes ) this._process_attributes();

  this.get_safe_attributes_names = function(){
    return this._safe_attributes;
  }

  return this.get_safe_attributes_names();
};


Model.prototype.get_attributes_description = function(){
  if ( !this._attr_description ) this._process_attributes();

  this.get_attributes_description = function(){
    return this._attr_description;
  }

  return this.get_attributes_description();
};


Model.prototype._process_attributes = function(){
  var attributes = this.app.tools.to_object( this.attributes(), 2 );
  this._safe_attributes = [];

  for ( var attr in attributes ) {
    var description = attributes[ attr ];

    // check for safe attribute
    if ( description['safe'] ) {
      this._safe_attributes.push( attr );
      delete description['safe'];
    }

    // check for alternative errors
    if ( description['errors'] ) {
      this._alternative_errors[ attr ] = description['errors'];
      delete description['errors'];
    }

    // check for filters
    if ( description['filters'] ) {
      this._filters[ attr ] = description['filters'];
      delete description['filters'];
    }

    // check for cloning attributes
    for ( var rule in description ) {

      var clone_from = null;
      if ( rule == 'clone' ) clone_from = description[ rule ];   // { clone : 'user.email' }
      if ( !clone_from )     clone_from = rule;                  // { 'user.email' : true }

      var matches = /(\w+)\.(\w+)/.exec( clone_from );           // 1st pocket - model, 2 - attribute for clone
      if ( !matches ) continue;

      var model = this.models[ matches[1] ];
      if ( !model ) {
        this.log( 'Model `%s` for cloning attribute `%s` is not found'.format( matches[1], matches[2] ), 'warning' );
        continue;
      }

      var cloned_description = model.get_attributes_description()[ matches[2] ];
      if ( !cloned_description ) {
        this.log( 'Description for attribute `%s` in model `%s` is not found'.format( matches[2], matches[1] ), 'warning' );
        continue;
      }

      for ( var cloned_rule in cloned_description )
        description[ cloned_rule ] = cloned_description[ cloned_rule ];

      delete description[ rule ];
      break;
    }
  }

  this._attr_description = attributes;
};


Model.prototype.equals = function ( model ) {
  return this == model;
};


Model.prototype.validate = function ( attributes, scenario ){
  attributes   = attributes || this.get_attributes_description();
  this._errors = {};

  for( var attribute in attributes ){

    var rules   = attributes[ attribute ];
    var errors  = this._alternative_errors[ attribute ] || {};

    for ( var rule in rules ) {
      var error = this.app.validator[ rule ](
        attribute,
        this.get_attribute( attribute ),
        rules[ rule ],
        errors[ rule ] );

      if ( error ) this._errors[ attribute ] = error;
    }
  }

  return !this.has_errors();
}


Model.prototype.has_errors = function () {
  return !!Object.keys( this._errors ).length;
}


Model.prototype.get_errors = function(){
  return this._errors;
}