/*
## Использование социальных сетей для аутентификации пользователей

Для удобства работы с асинхронными вызовами к базе данных можно использовать `async/await`.
Для поиска пользователя используем метод `User.findOne()`, передав в качестве условия поиска `email`.
Если пользователя нет в базе, то создадим нового, используя метод `User.create()`.
Не стоит забывать про возможные ошибки, их обязательно стоит обработать с помощью конструкции `try/catch`
и «вернуть» из функции с помощью коллбека `done`.

```js

const User = require('../../models/User');

module.exports = async function authenticate(strategy, email, displayName, done) {
  if (!email) {
    return done(null, false, 'Не указан email');
  }

  try {
    let user = await User.findOne({email});

    if (user) {
      return done(null, user);
    }

    user = await User.create({
      email, displayName,
    });
    done(null, user);
  } catch (err) {
    console.error(err);
    done(err);
  }
};

```

 */

const path = require('path');
const Koa = require('koa');
const Router = require('koa-router');
const handleMongooseValidationError = require('./libs/validationErrors');
const {login} = require('./controllers/login');
const {oauth, oauthCallback} = require('./controllers/oauth');

const app = new Koa();

app.use(require('koa-static')(path.join(__dirname, 'public')));
app.use(require('koa-bodyparser')());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err.status) {
      ctx.status = err.status;
      ctx.body = {error: err.message};
    } else {
      console.error(err);
      ctx.status = 500;
      ctx.body = {error: 'Internal server error'};
    }
  }
});

const router = new Router({prefix: '/api'});

router.post('/login', login);

router.get('/oauth/:provider', oauth);
router.post('/oauth_callback', handleMongooseValidationError, oauthCallback);

app.use(router.routes());

// this for HTML5 history in browser
const fs = require('fs');

const index = fs.readFileSync(path.join(__dirname, 'public/index.html'));
app.use(async (ctx) => {
  if (ctx.url.startsWith('/api') || ctx.method !== 'GET') return;

  ctx.set('content-type', 'text/html');
  ctx.body = index;
});

module.exports = app;
