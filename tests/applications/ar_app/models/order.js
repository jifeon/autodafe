module.exports = Order.inherits( autodafe.db.ActiveRecord );

function Order( params ) {
  this._init( params );
}


Order.prototype.get_table_name = function(){
  return 'orders';
}


Order.prototype.relations = function(){
  return {
    items       : this.has_many( 'item' ).by( 'col1, col2' ),
    item_count  : this.stat( 'item' ).by( 'col1, col2' )
  }
}