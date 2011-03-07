//todo: удалить когда будут напианы тесты и документация

var autodafe = require('../autodafe');
var config = require('../common_config');
var path = require( 'path' );

config.base_dir = '/var/www/html/node.autodafe.js/tests/test_app/';

var app = autodafe.create_application( config );
app.mail.send( {
  text        : 'autodafe mail test',
  subject     : 'HEllO',
  attachments : [
    {
      path : '/var/www/html/node.autodafe.js/framework/mailing/mailer.js',
      type : 'text/javascript',
      name : 'file.js'
    },
    {
      path : '/var/www/html/node.autodafe.js/framework/mailing/test.js',
      type : 'text/javascript',
      name : 'file2.js'
    }
  ]
} );