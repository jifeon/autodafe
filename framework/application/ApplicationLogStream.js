var TransformStream = require('stream').Transform;

require('util').inherits(ApplicationLogStream, TransformStream);

/**
 * @class ApplicationLogStream
 * @extends stream.Transform
 * @param {object} [options]
 * @constructor
 */
function ApplicationLogStream(options) {
    TransformStream.call(this, options);
    this.setEncoding('utf8');
}

ApplicationLogStream.prototype._transform = function (chunk, encoding, done) {
    this.push(chunk, encoding);
    done();
};

module.exports = ApplicationLogStream;