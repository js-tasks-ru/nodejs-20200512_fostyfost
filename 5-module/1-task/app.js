const path = require('path')
const Koa = require('koa')
const app = new Koa()

app.use(require('koa-static')(path.join(__dirname, 'public')))
app.use(require('koa-bodyparser')())

const Router = require('koa-router')
const router = new Router()

const PUBLISH_EVENT_NAME = 'publish'

const createEventBus = () => {
  const subscribers = {}

  const publish = (eventName, data) => {
    if (!Array.isArray(subscribers[eventName])) {
      return
    }

    subscribers[eventName].forEach((callback) => {
      callback(data)
    })
  }

  const subscribe = (eventName, callback) => {
    if (!Array.isArray(subscribers[eventName])) {
      subscribers[eventName] = []
    }

    subscribers[eventName].push(callback)

    const index = subscribers[eventName].length - 1

    return {
      unsubscribe() {
        subscribers[eventName].splice(index, 1)
      }
    }
  }

  return {
    publish,
    subscribe,
  }
}

const eventBus = createEventBus()

const awaitMessage = async () => {
  return new Promise(resolve => {
    eventBus.subscribe(PUBLISH_EVENT_NAME, message => {
      resolve(message)
    })
  })
}

router.get('/subscribe', async (ctx, next) => {
  ctx.body = await awaitMessage()

  return next()
})

router.post('/publish', async (ctx, next) => {
  const message = ctx.request?.body?.message

  if (message) {
    eventBus.publish(PUBLISH_EVENT_NAME, message)
  }

  ctx.body = message

  return next()
})

app.use(router.routes())

module.exports = app
