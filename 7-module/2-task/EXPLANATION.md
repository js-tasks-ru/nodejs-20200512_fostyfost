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
