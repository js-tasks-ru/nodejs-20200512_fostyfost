const Message = require('../models/Message')
const mapMessage = require('../mappers/message')

module.exports.messageList = async ctx =>  {
  const messages = await Message
    .find({ chat: ctx.user._id })
    .sort({ date: 1 })
    .limit(20)

  ctx.body = { messages: messages.map(mapMessage)}
}
