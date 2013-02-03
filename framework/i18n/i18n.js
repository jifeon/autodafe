var Gettext = require('node-gettext');
var fs      = require('fs');
var path    = require('path');
var locale  = require('locale');
var _ = require('underscore');

module.exports = I18n.inherits( global.autodafe.Component );

function I18n(params){
  this._init(params);
}


I18n.prototype._init = function(params){
  I18n.parent._init.call(this, params);

  this.gt      = null;
  this.locales = null;

  this.discover = _.defaults(params.discover, {
    host    : null,
    url     : null,
    user    : null,
    cookie  : null
  });

  this.default_locale = null;

  this._init_locales(params.locales);
};


I18n.prototype._init_locales = function(locales){
  var possible_locales = Object.keys(locales);
  this.locales = new locale.Locales(possible_locales);
  this.default_locale = locale.Locale['default'] = possible_locales[0] || 'en_US';

  this.app.on( 'views_are_loaded', this._load_files.bind(this, locales));
  if ( this.app.views_loaded ) this._load_files(locales);
};


I18n.prototype._load_files = function(locales){
  this.gt = new Gettext;

  for (var domain in locales){
    var file_path = path.join(this.app.base_dir, locales[domain]);
    var file = fs.readFileSync(file_path);
    this.gt.addTextdomain(domain, file);
  }
};


I18n.prototype.get_text = function(text, response){
  var request = response.request;
  if (!request.locale) {

    var requested_locale, matches;
    if (this.discover.host instanceof RegExp && request.host) {
      matches = this.discover.host.exec(request.host);
      if (matches) requested_locale = matches[1];
    }

    if (!requested_locale && this.discover.url instanceof RegExp && request.url) {
      matches = this.discover.url.exec(request.url);
      if (matches) requested_locale = matches[1];
    }

    if (!requested_locale && this.discover.user && request.user && !request.user.is_guest()) {
      requested_locale = request.user[this.discover.user];
    }

    if (!requested_locale && this.discover.cookie) {
      requested_locale = request.client.get_cookie('autodafe_locale');
    }

    if (!requested_locale) {
      var locales = new locale.Locales(request.original_request.headers['accept-language']);
      requested_locale = locales.best(this.locales).language;
    }

    request.locale = requested_locale || this.default_locale;
  }

  return this.gt.dgettext(request.locale, text);
};