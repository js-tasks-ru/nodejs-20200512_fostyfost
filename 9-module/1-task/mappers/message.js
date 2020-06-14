module.exports = function mapMessage(message) {
  return {
    id: message._id,
    date: message.date,
    text: message.text,
    user: message.user,
  }
}
