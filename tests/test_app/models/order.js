var ActiveRecord = require( 'db/ar/active_record' );

module.exports = Order.inherits( ActiveRecord );

function Order( params ) {
  this._init( params );
}

Order.table_name = 'testbase_ar.orders';