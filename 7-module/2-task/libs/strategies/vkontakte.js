// const VkontakteStrategy = require('passport-vkontakte').Strategy
const GithubStrategy = require('passport-github').Strategy
const config = require('../../config')
const get = require('lodash/get')
const authenticate = require('./authenticate')

/*module.exports = new VkontakteStrategy({
  clientID: config.providers.vkontakte.app_id,
  clientSecret: config.providers.vkontakte.app_secret,
  callbackURL: config.providers.vkontakte.callback_uri,
  scope: ['user:email'],
  session: false,
}, function(accessToken, refreshToken, params, profile, done) {
  authenticate('vkontakte', params.email, profile.displayName, done)
})*/

const strategy = new GithubStrategy({
  clientID: config.providers.github.app_id,
  clientSecret: config.providers.github.app_secret,
  callbackURL: config.providers.github.callback_uri,
  scope: ['user:email'],
  session: false,
}, function(accessToken, refreshToken, profile, done) {
  authenticate('vkontakte', get(profile, 'emails[0].value'), profile.username, done)
})

strategy.name = 'vkontakte'

module.exports = strategy
