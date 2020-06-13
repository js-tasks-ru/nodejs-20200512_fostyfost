const uuid = require('uuid/v4')
const User = require('../models/User')
const sendMail = require('../libs/sendMail')

module.exports.register = async (ctx, next) => {
  const errors = {}

  const {email, displayName, password} = ctx.request.body

  if (!email) {
    errors.email = 'Необходимо указать адрес электропочты'
  }

  if (!password) {
    errors.password = 'Необходимо указать пароль'
  }

  if (Object.keys(errors).length) {
    ctx.status = 400
    ctx.body = { errors }
  }

  try {
    const verificationToken = uuid()

    const user = new User({ email, displayName, verificationToken })
    await user.setPassword(password)
    await user.save()

    await sendMail({
      template: 'confirmation',
      locals: { token: verificationToken },
      to: email,
      subject: 'Подтвердите почту',
    })

    ctx.body = { status: 'ok' }
  } catch (error) {
    const errors = Object.entries(error.errors || { error: error.message })
      .reduce((acc, [errorKey, errorObject]) => {
        acc[errorKey] = errorObject.message
        return acc
      }, {})

    ctx.status = 400
    ctx.body = { errors }
  }
}

module.exports.confirm = async (ctx, next) => {
  const { verificationToken } = ctx.request.body;

  const user = await User.findOne({ verificationToken: verificationToken })

  if (user) {
    user.verificationToken = undefined

    await user.save()

    const token = await ctx.login(user)

    ctx.body = { token }
  } else {
    ctx.status = 400
    ctx.body = { error: 'Ссылка подтверждения недействительна или устарела' }
  }
}
