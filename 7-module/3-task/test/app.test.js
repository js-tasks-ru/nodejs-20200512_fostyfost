const app = require('../app');
const connection = require('../libs/connection');
const User = require('../models/User');
const Session = require('../models/Session');
const axios = require('axios');
const request = axios.create({
  responseType: 'json',
  validateStatus: () => true,
});

const expect = require('chai').expect;

describe('7-module-3-task', () => {
  describe('сессии', function () {
    let server;
    before((done) => {
      server = app.listen(3000, done);
    });

    beforeEach(async () => {
      await User.deleteMany({});
      await Session.deleteMany({});
    });

    after(async () => {
      await User.deleteMany({});
      await Session.deleteMany({});
      connection.close();
      server.close();
    });

    it('для пользователя должна создаваться сессия', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const u = new User(userData);
      await u.setPassword(userData.password);
      await u.save();

      const response = await request({
        method: 'post',
        url: 'http://localhost:3000/api/login',
        data: userData,
      });

      expect(response.data, 'с сервера должен вернуться токен сессии').to.have.property('token');

      const session = await Session.findOne({token: response.data.token});

      expect(session, 'сессия должна быть создана').to.exist;
      expect(session.user.toString(), 'сессия должна быть создана для заданного пользователя')
        .to.equal(u.id);
    });

    it('авторизационный заголовок должен корректно обрабатываться', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const u = new User(userData);
      await u.setPassword(userData.password);
      await u.save();

      await Session.create({token: 'token', user: u, lastVisit: new Date()});

      const response = await request({
        method: 'get',
        url: 'http://localhost:3000/api/me',
        headers: {
          'Authorization': 'Bearer token',
        },
      });

      expect(response.data).to.eql({
        email: userData.email,
        displayName: userData.displayName,
      });
    });

    it('время последнего захода должно обновиться', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const u = new User(userData);
      await u.setPassword(userData.password);
      await u.save();

      const now = new Date();
      await Session.create({token: 'token', user: u, lastVisit: now});

      await request({
        method: 'get',
        url: 'http://localhost:3000/api/me',
        headers: {
          'Authorization': 'Bearer token',
        },
      });

      const session = await Session.findOne({token: 'token'});
      expect(session.lastVisit).to.be.above(now);
    });

    it('несуществующий токен должен приводить к ошибке', async () => {
      const response = await request({
        method: 'get',
        url: 'http://localhost:3000/api/me',
        headers: {
          'Authorization': 'Bearer not_existing_token',
        },
      });

      expect(response.status).to.equal(401);
      expect(response.data.error).to.equal('Неверный аутентификационный токен');
    });

    it('незалогиненный пользователь не может сделать запрос на /me', async () => {
      const response = await request({
        method: 'get',
        url: 'http://localhost:3000/api/me',
      });

      expect(response.status).to.equal(401);
      expect(response.data.error).to.equal('Пользователь не залогинен');
    });
  });
});
