const Message = require('../models/Message')
const mapMessage = require('../mappers/message')

module.exports.messageList = async ctx =>  {
  const messages = await Message.find({ user: ctx.user.displayName })

  ctx.body = { messages: messages.map(mapMessage)}
}
