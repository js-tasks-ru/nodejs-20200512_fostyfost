const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'GET':
      if (pathname.split(path.sep).length > 1) {
        res.statusCode = 400
        res.end();
        return;
      }

      fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
          res.statusCode = err.code === 'ENOENT' ? 404 : 500;
          res.end(JSON.stringify(err));
          return;
        }

        res.statusCode = 200
        res.end(data);
      });
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
