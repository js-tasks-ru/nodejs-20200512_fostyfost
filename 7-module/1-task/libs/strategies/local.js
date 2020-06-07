const LocalStrategy = require('passport-local').Strategy

const UserModel = require('../../models/User')

module.exports = new LocalStrategy(
  { usernameField: 'email', session: false },
  (email, password, done) => {
    UserModel.findOne({ email }, async (err, user) => {
      if (err) {
        return done(err)
      }

      if (!user) {
        return done(null, false, 'Нет такого пользователя')
      }

      if (!await user.checkPassword(password)) {
        return done(null, false, 'Неверный пароль')
      }

      return done(null, user)
    })
  },
)
