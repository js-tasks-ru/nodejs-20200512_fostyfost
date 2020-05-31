const url = require('url')
const http = require('http')
const path = require('path')
const fs = require('fs')

const server = new http.Server()

server.on('request', (request, response) => {
  const pathname = url.parse(request.url).pathname.slice(1)

  if (pathname.split(path.sep).length > 1) {
    response.statusCode = 400
    response.end()
    return
  }

  const filepath = path.join(__dirname, 'files', pathname)

  switch (request.method) {
    case 'DELETE':
      fs.access(filepath, fs.F_OK, fileDoesNotExist => {
        if (fileDoesNotExist) {
          response.statusCode = 404
          response.end()
          return
        }

        fs.unlink(filepath, err => {
          if (err) {
            response.statusCode = 500
          } else {
            response.statusCode = 200
          }

          response.end()
        })
      })

      break

    default:
      response.statusCode = 501
      response.end('Not implemented')
  }
})

module.exports = server
