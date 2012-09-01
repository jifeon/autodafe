module.exports = Test2.inherits( global.autodafe.Controller );


function Test2( params ){
  this._init( params );
}


Test2.prototype.global_view_params = function( response, request ){
  return {
    global_param : 'global'
  }
}


Test2.prototype._init = function( params ){
  Test2.parent._init.call( this, params );

  this.views_folder = 'controllers_test';
}


Test2.prototype.index = function( response ){
  response.send();
}


Test2.prototype.test_params = function( response ){
  response.send({
    simple : 'simple',
    ar     : [1,2,3]
  });
}


Test2.prototype.async_params = function( response ){
  var emitter = new process.EventEmitter;

  process.nextTick( function(){
    emitter.emit('success', [1,2,3]);
  });

  (function( cb ){
    process.nextTick( cb.bind( null, null, 'simple' ) );
  })( response.callback_for('simple'));

  response.view_name('test_params').send({
    ar : emitter
  });
}