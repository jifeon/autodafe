var ReadableStream = require('stream').Readable;

require('util').inherits(ComponentLogStream, ReadableStream);

/**
 * @class ComponentLogStream
 * @extends stream.Readable
 * @param {object} [options] options to readable node stream
 * @constructor
 */
function ComponentLogStream(options) {
    ReadableStream.call(this, options);
    this.setEncoding('utf8');
}

ComponentLogStream.prototype.log = function (message) {
    this.push(message);
};

ComponentLogStream.prototype._read = function () {
};

module.exports = ComponentLogStream;