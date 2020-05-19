const stream = require('stream');
const os = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);

    this._lastLine = '';
  }

  // noinspection JSUnusedGlobalSymbols
  _transform(chunk, _, callback) {
    let data = chunk.toString();

    if (this._lastLine) {
      data = this._lastLine + data;
    }

    const lines = data.split(os.EOL);

    this._lastLine = lines.splice(lines.length - 1, 1)[0];

    lines.forEach(this.push.bind(this));

    callback();
  }

  // noinspection JSUnusedGlobalSymbols
  _flush(callback) {
    if (this._lastLine) {
      this.push(this._lastLine)
    }

    this._lastLine = null

    callback()
  }
}

module.exports = LineSplitStream;
