var ActiveRecord = require( 'db/ar/active_record' );

module.exports = Order.inherits( ActiveRecord );

function Order( params ) {
  this._init( params );
}

Order.prototype.get_table_name = function(){
  return 'testbase_ar.orders';
}

Order.prototype.relations = function(){
  return {
    items       : this.has_many( 'item' ).by( 'col1, col2' ),
    item_count  : this.stat( 'item' ).by( 'col1, col2' )
  }
}