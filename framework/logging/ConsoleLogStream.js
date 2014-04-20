var TransformStream = require('stream').Transform;

require('util').inherits(ConsoleLogStream, TransformStream);


/**
 * @class ConsoleLogStream
 * @extends stream.Transform
 * @param {object} [options]
 * @constructor
 */
function ConsoleLogStream(options) {
    TransformStream.call(this, options);
    this.setEncoding('utf8');

    this._writableState.objectMode = true;
    this._readableState.objectMode = false;
}

ConsoleLogStream.prototype._transform = function (chunk, encoding, done) {
    var stream = this._chunkIsError(chunk) ? process.stderr : process.stdout,
        message = chunk.formattedMessage;
    stream.write(message, encoding);
    this.push(message, encoding);
    done();
};

ConsoleLogStream.prototype._chunkIsError = function (chunk) {
    return /^(emergency|alert|critical|error)$/.test(chunk.level);
};

module.exports = ConsoleLogStream;