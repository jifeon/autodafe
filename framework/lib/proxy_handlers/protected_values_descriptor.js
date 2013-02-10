module.exports = ProtectedValuesDescriptor;

function ProtectedValuesDescriptor(params) {
  this._init(params);
}


ProtectedValuesDescriptor.prototype._init = function (params) {
  if (!params || !params.name || !params.target)
    throw new Error('`name` and `target` are required in ProtectedValuesDescriptor._init');

  this.name = params.name;
  this.target = params.target;
  this.value = params.value;
  this.params = params.params || {};

  if (typeof params.get == "function") this.get = params.get;
  if (typeof params.set == "function") this.set = params.set;
};


ProtectedValuesDescriptor.prototype.get = function (descriptor) {
  return descriptor.value;
};


ProtectedValuesDescriptor.prototype.set = function (value, descriptor) {
  throw new TypeError('Property `%s` of `%s` is read only'.format(descriptor.name, this.class_name));
};


ProtectedValuesDescriptor.prototype['delete'] = function () {
  this.reset(true);
  this.value = undefined;
  this.params = {};

  return true;
};


ProtectedValuesDescriptor.prototype._default_set = function (value, descriptor) {
  descriptor.value = value;
};


ProtectedValuesDescriptor.prototype.reset = function (default_set) {
  this.get = this.constructor.prototype.get;
  this.set = default_set ? this._default_set : this.constructor.prototype.set;
};