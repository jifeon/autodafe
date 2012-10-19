/**
 * Входной скрипт. Обычно здесь подключается конфигурационный файл, создается и запускается приложение.
 */
var config    = require( './config' ),
    autodafe  = require( 'autodafe' );

autodafe.create_application( config ).run();