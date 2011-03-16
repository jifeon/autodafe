/**
 * Created by JetBrains PhpStorm.
 * User: jifeon
 * Date: 11.03.11
 * Time: 17:50
 * To change this template use File | Settings | File Templates.
 */

var ActiveRecord = require( 'db/ar/active_record' );

var Post = module.exports = function( params ) {
  ActiveRecord.prototype._init.call( this, params );
};


Post.get_table_name = function () {
  return 'posts';
};

require( 'sys' ).inherits( Post, ActiveRecord );
