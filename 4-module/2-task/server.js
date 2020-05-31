const url = require('url')
const http = require('http')
const path = require('path')
const fs = require('fs')

const LimitSizeStream = require('./LimitSizeStream')
const LimitExceededError = require('./LimitExceededError')

const MAX_FILE_SIZE = 1048576 // 1 Мегабайт

const noop = () => {}

const server = new http.Server()

server.on('request', (request, response) => {
  const pathname = url.parse(request.url).pathname.slice(1)

  const filepath = path.join(__dirname, 'files', pathname)

  switch (request.method) {
    case 'POST':
      if (pathname.split(path.sep).length > 1) {
        response.statusCode = 400
        response.end()
        return
      }

      request.on('aborted', () => fs.unlink(filepath, noop))

      fs.access(filepath, fs.F_OK, fileDoesNotExist => {
        // Ошибка возникает, когда файла нет.
        // Нас это устраивает: создаём файл, если получится.
        if (fileDoesNotExist) {
          const limitedStream = new LimitSizeStream({limit: MAX_FILE_SIZE})
          const writeStream = fs.createWriteStream(filepath)

          limitedStream.on('error', err => {
            response.body = JSON.stringify(err)

            fs.unlink(filepath, noop)

            if (err instanceof LimitExceededError) {
              response.statusCode = 413
              response.end('Payload Too Large')
            } else {
              response.statusCode = 500
              response.end()
            }
          })

          writeStream.on('finish', () => {
            response.statusCode = 201
            response.end()
          })

          request.pipe(limitedStream).pipe(writeStream)

          request.on('end', () => {
            response.statusCode = 201
            response.end()
          })

          return
        }

        response.statusCode = 409
        response.end()
      })

      break

    default:
      response.statusCode = 501
      response.end('Not implemented')
  }
})

module.exports = server
