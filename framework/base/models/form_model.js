module.exports = FormModel.inherits( autodafe.Model );

function FormModel( params ) {
  this._init( params );
}


FormModel.prototype._init = function( params ) {
  FormModel.parent._init.call( this, params );

  this._.valid.get = function(){
    return !this.has_errors();
  }
};