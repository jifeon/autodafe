var TransformStream = require('stream').Transform,
    s = require('sprintf-js').sprintf,
    moment = require('moment');

require('util').inherits(ApplicationLogStream, TransformStream);

/**
 * @typedef {object} LogChunk
 * @property {string} message
 * @property {string} level
 */

/**
 * @typedef {LogChunk} ApplicationLogChunk
 * @property {string} formattedMessage
 * @property {Date} date
 * @property {Date} formattedDate
 * @property {string} module
 */

/**
 * @class ApplicationLogStream
 * @extends stream.Transform
 * @param {object} [options]
 * @constructor
 */
function ApplicationLogStream(options) {
    TransformStream.call(this, options);
    this.setEncoding('utf8');

    this._writableState.objectMode = true;
    this._readableState.objectMode = true;

    this._format = '%(formattedDate)s [%(level)s] [%(module)s] %(message)s';
    this._dateFormat = 'DD MM YYYY H:m:s:SSS';
}

/**
 * @param {LogChunk} chunk
 * @param {string} encoding
 * @param {function} done
 * @private
 */
ApplicationLogStream.prototype._transform = function (chunk, encoding, done) {
    chunk.date = chunk.date || new Date;
    chunk.formattedDate = moment(chunk.date).format(this._dateFormat);
    chunk.module = chunk.module || 'Application';
    chunk.formattedMessage = s(this._format, chunk);
    this.push(chunk, encoding);
    done();
};

module.exports = ApplicationLogStream;