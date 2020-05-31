# Koa.js

Официальная документация [Koa](https://koajs.com/).

## Статические файлы

Для отдачи с сервера статических файлов (стилей, скриптов, картинок и т.д.) мы будем использовать 
модуль `koa-static`, его логика очень проста – для каждого `GET` и `HEAD` запроса проверяется, 
есть ли соответствующий файл на диске в заданной папке и он отдается. Если файла нет – отдается `404`.

## Парсинг запросов

При обработке пользовательских запросов нам потребуется обрабатывать отправленные формы и AJAX запросы.
В этом нам поможет модуль `koa-bodyparser`, который парсит приходящие на сервер запросы 
и устанавливает свойство `ctx.request.body` в объект, который соответствует телу запроса. 
Например для формы:

```html

<form method="POST" action="/login">
    <input name="email" type="email" />
    <input name="password" type="password" />
    <button type="submit">Sign In</button>
</form>

```

значение `ctx.request.body` будет равно:

```js

app.use(require('koa-bodyparser')());
app.use(async (ctx, next) => {
  console.log(ctx.request.body.email); // email from form
  console.log(ctx.request.body.password); // password from form
});

```

Этот модуль обрабатывает не только формы, но и AJAX запросы (заголовок `Content-Type` которых установлен 
в значение `application/json`).

## Роутинг

В качестве решения для роутинга запросов мы будем использовать библиотеку `koa-router`, 
которая позволяет добавлять обработчики и цепочки обработчиков на конкретные пути и методы запросов:

```js

const Router = require('koa-router');
const router = new Router();

router.get('/path1', async (ctx, next) => {}); // GET /path1
router.post('/path2/:id', async (ctx, next) => {}); // POST /path2/1, POST /path2/2, etc.
router.get('/path3',
  async (ctx, next) => {},
  async (ctx, next) => {},
  async (ctx, next) => {}
); // middleware chain

```

## Чат на Koa.js

Первым делом давайте представим как может выглядеть обработчик запроса `GET /subscribe`. 
Очевидно, что при обработке этого запроса должен создаваться новый промис, 
однако пока не совсем ясно когда он будет резолвится и с каким значением. 
Однако некоторый код мы можем написать уже сейчас и выглядеть он будет так:

```js

router.get('/subscribe', async (ctx, next) => {
  await new Promise(resolve => {
  });
});

```

Теперь, если мы запустим сервер – то увидим, что запрос `GET /subscribe`, 
который отправляет клиент «подвисает» навсегда. Это конечно не то, что мы хотим получить в результате, 
поэтому давайте подумаем, когда же наступит тот момент, когда промис должен быть зарезолвлен? 
Как следует из условия задачи (и описания технологии long polling) – этот момент, 
это пришедший запрос `POST /publish`, и резолвиться промис должен с текстом сообщения. 
Однако как мы можем вызвать функцию `resolve`, доступную лишь внутри функции-конструктора объекта промиса 
из другой функции? Ответ – нам нужно вынести ее во внешнюю область видимости, так, 
чтобы обе функции могли получить к ней доступ. Так как запросов, ожидающих ответа у нас может быть много, 
то и хранить мы будем множество функций `resolve`. Воспользуемся для этого структурой данных `Set`:

```js

const clients = new Set();

router.get('/subscribe', async (ctx, next) => {
  const message = await new Promise(resolve => {
    clients.add(resolve);
  });

  ctx.body = message;
});

```

Теперь нам необходимо реализовать обработчик запроса `POST /publish`. 
Его логика достаточно проста: нам нужно получить текст сообщения, которое отправил клиент, убедившись, 
что оно не пустое. Затем зарезолвить все ожидающие промисы с этим сообщением и очистить массив `clients`. 
После этого мы можем сообщить отправителю, что все хорошо.

```js

router.post('/publish', async (ctx, next) => {
  const message = ctx.request.body.message;

  if (!message) {
    ctx.throw(400, 'required field `message` is missing');
  }

  clients.forEach(resolve => {
    resolve(message);
  });

  clients.clear();

  ctx.body = 'ok';
});

```

Не стоит также забывать о таком частом случае как обрыв соединения, 
при этом нам нужно удалить функцию `resolve` из `clients`.

```js

router.get('/subscribe', async (ctx, next) => {
  const message = await new Promise((resolve, reject) => {
    clients.add(resolve);

    ctx.res.on('close', function() {
      clients.delete(resolve);
      resolve();
    });
  });

  ctx.body = message;
});

```
