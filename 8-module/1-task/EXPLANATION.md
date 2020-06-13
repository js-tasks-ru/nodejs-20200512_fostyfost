# Отправка почты и шаблонизация

## Отправка почты

Документация к [nodemailer](https://nodemailer.com/about/).

## Шаблонизация

Огромная популярность SPA приводит к тому, что генерация HTML на сервере используется все реже и реже, 
однако случаев когда это по-прежнему необходимо все-таки достаточно. Например, это генерация писем, 
которые время от времени необходимо отправлять пользователям, подтверждая их регистрацию или оплату и т.д.

В наших проектах для шаблонизации мы будем пользоваться модулем `pug`, который предоставляет удобный 
синтаксис и большое количество конструкций для динамического формирования HTML на основании переменных, 
циклов и так далее.

Официальная документация к модулю pug доступна на [официальном сайте](https://pugjs.org/).

## Регистрация с подтверждением email

### Процесс регистрации пользователя (обработка запроса `POST`-запроса на `/register`)

Первым делом при обработке запроса на регистрацию нам необходимо создать документ пользователя, 
используя значения из полей тела запроса, а также добавив специальный токен, 
который будет использоваться при подтверждении email.

```js

module.exports.register = async (ctx, next) => {
  const verificationToken = uuid();
  const user = new User({
    email: ctx.request.body.email,
    displayName: ctx.request.body.displayName,
    verificationToken
  });

  await user.setPassword(ctx.request.body.password);
  await user.save();

  ctx.body = {status: 'ok'};
};

```

Также, на данном этапе нашей задаче является отправка письма пользователю со ссылкой, содержащей токен. 
Для этого можно воспользоваться функцией `sendMail`:

```js

module.exports.register = async (ctx, next) => {
  const verificationToken = uuid();
  const user = new User({
    email: ctx.request.body.email,
    displayName: ctx.request.body.displayName,
    verificationToken,
  });

  await user.setPassword(ctx.request.body.password);
  await user.save();

  await sendMail({
    template: 'confirmation',
    locals: {token: verificationToken},
    to: user.email,
    subject: 'Подтвердите почту',
  });

  ctx.body = {status: 'ok'};
};

```

Не стоит забывать, что создание документа – операция, которая легко может завершиться ошибками валидации, 
в этом случае мы должны их обработать и вернуть пользователю в подходящем виде. 
Этим занимается middleware `handleMongooseValidationError`, который нам достаточно подключить:

```js

router.post('/register', handleMongooseValidationError, register);

```

### Подтверждение email (обработка `POST`-запроса на `/confirm`)

Логика обработки этого запроса достаточно проста: нам необходимо найти соответствующий документ 
в базе данных (используя значение поля `verificationToken`) и удалить это поле из базы, 
в ответ пользователю надо вернуть вновь сгенерированный токен.

```js

module.exports.confirm = async (ctx) => {
  const user = await User.findOne({
    verificationToken: ctx.request.body.verificationToken,
  });

  user.verificationToken = undefined;
  await user.save();

  const token = uuid();

  ctx.body = {token};
};

```

Обратите внимание, для удаления значения поля из базы его надо установить в `undefined`.

В данном случае не стоит также забывать, что пользователя может и не оказаться (допустим, 
токен уже был использован для подтверждения раньше) – в этом случае мы должны вернуть ошибку:

```js

module.exports.confirm = async (ctx) => {
  const user = await User.findOne({
    verificationToken: ctx.request.body.verificationToken,
  });

  if (!user) {
    ctx.throw(400, 'Ссылка подтверждения недействительна или устарела');
  }

  user.verificationToken = undefined;
  await user.save();

  const token = uuid();

  ctx.body = {token};
};

```

### Изменения в локальной стратегии

Остался лишь небольшой нюанс, касающийся момента, когда пользователь пытается войти на сайт, 
не подтвердив свою почту: в этом случае мы должны вернуть ему ошибку. 
Сделать это нужно лишь в том случае, если пара `email:password` были переданы верно 
(то есть лишь после того, как мы убедимся в их правильности).

```js

const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/User');

module.exports = new LocalStrategy(
  {usernameField: 'email', session: false},
  async function(email, password, done) {
    try {
      const user = await User.findOne({email});
      if (!user) {
        return done(null, false, 'Нет такого пользователя');
      }

      const isValidPassword = await user.checkPassword(password);

      if (!isValidPassword) {
        return done(null, false, 'Неверный пароль');
      }

      if (user.verificationToken) {
        return done(null, false, 'Подтвердите email');
      }

      return done(null, user);
    } catch (err) {
      done(err);
    }
  }
);

```

