var AppModule = global.autodafe.AppModule;

module.exports = TestsBatch.inherits( AppModule );

function TestsBatch( params ) {
  this._init( params );
}


TestsBatch.prototype._init = function( params ) {
  TestsBatch.parent._init.call( this, params );

  this.name  = params.name;
  this.tests = params.tests;
  this.suite = params.suite;

  this._transform_first_topic();
  this._add_tests();
};


TestsBatch.prototype._transform_first_topic = function () {
  var tests = this.tests;
  
  while ( typeof tests.topic == 'undefined' ) {
    var keys = Object.keys( tests );
    if ( !keys.length ) 
      throw new Error( 'TestBatch could not find first `topic` in "%s" batch'.format( this.name ) );
    
    tests = tests[ keys[0] ];
  }
  
  var self    = this;
  var topic   = tests.topic;
  tests.topic = function() {
    self.log( 'Running %s'.format( self.name ) );
    return typeof topic == 'function' ? topic.apply( this, arguments ) : topic;
  }
};


TestsBatch.prototype._add_tests = function () {
  var tests = {};
  tests[ this.name + ':' ] = this.tests;

  this.suite.addBatch( tests );
};