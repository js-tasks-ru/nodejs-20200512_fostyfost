const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
    super(options);
    this.options = options;
    this._chunksLength = 0;
  }

  // noinspection JSUnusedGlobalSymbols
  _transform(chunk, _, callback) {
    if (this._chunksLength >= this.options.limit) {
      this.destroy(new LimitExceededError());
    } else {
      callback(null, chunk);
    }

    this._chunksLength += chunk.length;
  }
}

module.exports = LimitSizeStream;
