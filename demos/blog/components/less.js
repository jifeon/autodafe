var less        = require('less');
var fs          = require('fs');
var path        = require('path');

// наследуем от Component
module.exports = Less.inherits( global.autodafe.Component );

/**
 * Пользовательский компонент компилирующий less файлы в css
 *
 * @constructor
 * @extends Component
 * @param {Object} params параметры для компонента, задаются в конфигурационном файле
 */
function Less( params ) {
  this._init( params );
}

/**
 * Инициализация компонента
 *
 * @param {Object} params
 */
Less.prototype._init = function ( params ) {
  // Вызов инициализации родительского класса
  Less.parent._init.call( this, params );

  // каждый раз при загрузке представлений надо перекомпилировать стили
  this.app.on( 'views_are_loaded', this._compile_templates.bind( this ));

  // если включен кэш представлений, то к этому моменту они уже загружены, и их надо скомпилировать
  if ( this.app.views_loaded ) this._compile_templates();
};


/**
 * Компилирует файл style.less и сохраняет в style.css
 *
 * @private
 */
Less.prototype._compile_templates = function(){
  // ситаем файл
  var style = fs.readFileSync( path.join( this.app.base_dir, 'static/css/style.less' ), 'utf8' );

  // создаем парсер less
  var parser = new less.Parser({
    paths: [ path.join( this.app.base_dir, 'node_modules/twitter-bootstrap/less/' ) ]
  });

  var self = this;
  // парсим
  parser.parse( style, function (e, tree) {
    // компануем сжатый css
    var css = tree.toCSS({ compress: true });

    // создаем css файл
    var css_file = path.join( self.app.base_dir, 'static/css/style.css' );
    if ( fs.existsSync( css_file ) ) fs.unlinkSync( css_file );
    var fd = fs.openSync( css_file, 'a', 0666 );

    // и записываем его
    fs.writeSync( fd, css, null, 'utf8' );
    fs.closeSync( fd );
  });
}