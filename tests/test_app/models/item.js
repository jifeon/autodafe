var ActiveRecord = require( 'db/ar/active_record' );

module.exports = Item.inherits( ActiveRecord );

function Item( params ) {
  this._init( params );
}

Item.prototype.get_table_name = function(){
  return 'testbase_ar.items';
}


Item.prototype.relations = function(){
  return {
    order : this.belongs_to( 'order' ).by( 'col1, col2', {
      alias : '_order'
    } )
  }
}