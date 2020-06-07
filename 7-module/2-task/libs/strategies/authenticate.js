const UserModel = require('../../models/User')

module.exports = async (strategy, email, displayName, done) => {
  if (!email) {
    return done(null, false, 'Не указан email')
  }

  try {
    let user = await UserModel.findOne({ email })

    if (!user) {
      user = await UserModel.create({ email, displayName })
    }

    return done(null, user)
  } catch (error) {
    return done(error)
  }
}
