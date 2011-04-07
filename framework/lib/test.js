require('./tools.js');

function A() {
  this.init();
}

A.prototype.init = function AI() {
  console.log( 'A' );
}


B.inherits( A );

function B() {
  this.init();
}

B.prototype.init = function BI() {
  console.log( 'B' );
  this.super_.init();
};


C.inherits( B );

function C() {
  this.init();
}

C.prototype.init = function CI () {
  console.log( 'C' );
  this.super_.init();
};


D.inherits( C );

function D() {
  this.init();
}

D.prototype.init = function DI() {
  console.log( 'D' );
  this.super_.init();
};

new D;