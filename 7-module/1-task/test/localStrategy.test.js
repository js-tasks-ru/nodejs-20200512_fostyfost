const connection = require('../libs/connection');
const localStrategy = require('../libs/strategies/local');
const expect = require('chai').expect;
const User = require('../models/User');
const users = require('../../../__data/users');

describe('7-module-1-task', () => {
  describe('passport local strategy', function() {
    before(async () => {
      await User.deleteMany();

      for (const user of users.users) {
        const u = new User(user);
        await u.setPassword(user.password);
        await u.save();
      }
    });

    after(async () => {
      await User.deleteMany({});
      connection.close();
    });

    it('поле usernameField должно должно содержать email', () => {
      expect(localStrategy._usernameField).to.equal('email');
    });

    it('стратегия должна возвращать ошибку если указан несуществующий email', (done) => {
      localStrategy._verify('notexisting@mail.com', 'pass', (err, user, info) => {
        if (err) return done(err);

        expect(user).to.be.false;
        expect(info).to.equal('Нет такого пользователя');
        done();
      });
    });

    it('стратегия должна возвращать ошибку если указан неверный пароль', (done) => {
      localStrategy._verify('user1@mail.com', 'pass', (err, user, info) => {
        if (err) return done(err);

        expect(user).to.be.false;
        expect(info).to.equal('Неверный пароль');
        done();
      });
    });

    it('стратегия должна возвращать объект пользователя если email и пароль верные', (done) => {
      localStrategy._verify('user1@mail.com', '123123', (err, user) => {
        if (err) return done(err);

        expect(user.displayName).to.equal('user1');
        done();
      });
    });
  });
});
