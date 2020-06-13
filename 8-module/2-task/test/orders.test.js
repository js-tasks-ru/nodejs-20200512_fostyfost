const mongoose = require('mongoose');
const {get} = require('lodash');

const app = require('../app');
const connection = require('../libs/connection');
const transportEngine = require('../libs/sendMail').transportEngine;

const axios = require('axios');
const request = axios.create({
  responseType: 'json',
  validateStatus: () => true,
});

const Order = require('./../models/Order');
const User = require('./../models/User');
const Session = require('./../models/Session');
const Category = require('./../models/Category');
const Product = require('./../models/Product');
const ObjectId = mongoose.Types.ObjectId;

const expect = require('chai').expect;

async function createUserAndSession(userData, token) {
  const user = new User(userData);
  await user.setPassword(userData.password);
  await user.save();
  await Session.create({token, user, lastVisit: new Date()});
  return user;
}

async function cleanUpDB() {
  await Order.deleteMany({});
  await User.deleteMany({});
  await Session.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
}

describe('8-module-2-task', () => {
  let server;
  const port = 3000;
  const serverURL = `http://localhost:${port}/api/orders`;

  after(() => {
    connection.close();
  });

  describe('модель заказа', () => {
    it('должна содержать обязательное свойство `user`', () => {
      const userField = Order.schema.obj.user;

      expect(userField, 'у модели есть свойство user').to.be.not.undefined;
      expect(userField.required, 'свойство user является обязательным').to.be.true;
      expect(
        userField.type,
        'тип свойства user - ObjectId'
      ).to.be.equal(mongoose.Schema.Types.ObjectId);
      expect(userField.ref, 'свойство user ссылается на модель `User`').to.be.equal('User');
    });

    it('должна содержать обязательное свойство `product`', () => {
      const productField = Order.schema.obj.product;

      expect(productField, 'у модели есть свойство product').to.be.not.undefined;
      expect(productField.required, 'свойство product является обязательным').to.be.true;
      expect(
        productField.type,
        'тип свойства product - ObjectId'
      ).to.be.equal(mongoose.Schema.Types.ObjectId);
      expect(productField.ref, 'свойство product ссылается на модель `Product`')
        .to.be.equal('Product');
    });

    it('должна содержать обязательное свойство `address`', () => {
      const addressField = Order.schema.obj.address;

      expect(addressField, 'у модели есть свойство address').to.be.not.undefined;
      expect(addressField.required, 'свойство address является обязательным').to.be.true;
      expect(addressField.type, 'тип свойства address - строка').to.be.equal(String);
    });

    it('должна содержать обязательное свойство `phone`', () => {
      const phoneField = Order.schema.obj.phone;

      expect(phoneField, 'у модели есть свойство phone').to.be.not.undefined;
      expect(phoneField.required, 'свойство phone является обязательным').to.be.true;
      expect(phoneField.type, 'тип свойства phone - строка').to.be.equal(String);
    });
  });

  describe('запрос POST /api/orders должен', () => {
    before((done) => {
      server = app.listen(port, done);
    });

    beforeEach(async () => {
      await cleanUpDB();
    });

    after(async () => {
      await cleanUpDB();
      server.close();
    });

    it('создать заказ в базе данных, если запрос сформирован корректно', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      await createUserAndSession(userData, token);

      const categories = [
        {
          '_id': ObjectId('5d2f7e66a5a47618d7080a0f'),
          'title': 'Детские товары и игрушки',
          'subcategories': [
            {
              '_id': ObjectId('5d2f7e66a5a47618d7080a15'),
              'title': 'Прогулки и детская комната',
            },
          ],
        },
      ];
      await Category.insertMany(categories);

      const products = [
        {
          '_id': ObjectId('5d2f7e66a5a47618d7080a1f'),
          'title': 'Коляска Adamex Barletta 2 in 1',
          'description': 'description',
          'category': categories[0]._id,
          'subcategory': categories[0].subcategories[0]._id,
          'images': [
            'http://magazilla.ru/jpg_zoom1/598194.jpg',
          ],
          'price': 21230,
        },
      ];
      await Product.insertMany(products);

      const body = {
        product: '5d2f7e66a5a47618d7080a1f',
        phone: '1234567800',
        address: 'home',
      };

      const response = await request({
        method: 'post',
        url: serverURL,
        data: body,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(response.data, 'тело ответа должно содержать id заказа').to.have.property('order');
      expect(
        response.data.order,
        'id заказа должен быть валдиным ObjectId'
      ).to.satisfy(ObjectId.isValid);

      const order = await Order.findById(response.data.order);

      expect(order, 'созданный зказа должен быть в базе данных').to.be.not.null;
      expect(order.product.toString(), 'созданный заказ должен содержать переданный продукт')
        .to.equal(body.product.toString());
      expect(order.phone, 'созданный заказ должен содержать переданный номер телефона')
        .to.be.equal(body.phone);
      expect(order.address, 'созданный заказ должен содержать переданный адресс')
        .to.be.equal(body.address);
    });

    it('отправить письмо пользователю об успешном создании заказа', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      const user = await createUserAndSession(userData, token);

      const categories = [{
        '_id': ObjectId('5d2f7e66a5a47618d7080a0f'),
        'title': 'Детские товары и игрушки',
        'subcategories': [
          {
            '_id': ObjectId('5d2f7e66a5a47618d7080a15'),
            'title': 'Прогулки и детская комната',
          },
        ],
      }];
      await Category.insertMany(categories);

      const products = [{
        '_id': ObjectId('5d2f7e66a5a47618d7080a1f'),
        'title': 'Коляска Adamex Barletta 2 in 1',
        'description': 'description',
        'category': categories[0]._id,
        'subcategory': categories[0].subcategories[0]._id,
        'images': [
          'http://magazilla.ru/jpg_zoom1/598194.jpg',
        ],
        'price': 21230,
      }];
      await Product.insertMany(products);

      const body = {
        product: '5d2f7e66a5a47618d7080a1f',
        phone: '1234567800',
        address: 'home',
      };

      let envelope;
      transportEngine.on('envelope', (_envelope) => {
        envelope = _envelope;
      });

      await request({
        method: 'post',
        url: serverURL,
        data: body,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(get(envelope, 'to[0]'), 'письмо отправлено на почту пользователя').to
        .equal(user.email);
    });

    it('использовать id авторизованного пользователя', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      const user = await createUserAndSession(userData, token);

      const categories = [
        {
          '_id': ObjectId('5d2f7e66a5a47618d7080a0f'),
          'title': 'Детские товары и игрушки',
          'subcategories': [
            {
              '_id': ObjectId('5d2f7e66a5a47618d7080a15'),
              'title': 'Прогулки и детская комната',
            },
          ],
        },
      ];
      await Category.insertMany(categories);

      const products = [
        {
          '_id': ObjectId('5d2f7e66a5a47618d7080a1f'),
          'title': 'Коляска Adamex Barletta 2 in 1',
          'description': 'description',
          'category': categories[0]._id,
          'subcategory': categories[0].subcategories[0]._id,
          'images': [
            'http://magazilla.ru/jpg_zoom1/598194.jpg',
          ],
          'price': 21230,
        },
      ];
      await Product.insertMany(products);

      const body = {
        product: '5d2f7e66a5a47618d7080a1f',
        phone: '1234567800',
        address: 'home',
        user: ObjectId(),
      };

      const response = await request({
        method: 'post',
        url: serverURL,
        data: body,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const order = await Order.findById(response.data.order);

      expect(order.user.toString(), 'id пользователя должен соответствовать авторизованому,' +
        'параметр в теле запроса должен быть проигнорирован').to.be.equal(user.id);
    });

    it('вернуть ошибку со статус кодом 400 и описанием ' +
      'ошибки валидации при неправильно сформированном запросе', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      await createUserAndSession(userData, token);

      const {status, data} = await request({
        method: 'post',
        url: serverURL,
        data: {
          products: 'foo-bar',
          phone: '12345',
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(status, 'статус код ответа должен быть 400').to.be.equal(400);
      expect(data, 'тело ответа должно содержать объект с ошибками').to.have.property('errors');
      expect(data.errors, 'products - ожидается получить ObjectId').to.have.property('product')
        .that.include('required');
      expect(data.errors, 'phone - свойство должно соответствовать шаблону')
        .to.have.property('phone')
        .that.equal('Неверный формат номера телефона.');
      expect(data.errors, 'address - свойство обязательно').to.have.property('address')
        .that.include('required');
    });

    it('вернуть ошибку со статусом 401 если пользователь не авторизован', async () => {
      const {status} = await request({
        method: 'post',
        url: serverURL,
      });

      expect(status, 'статус код ответа должен быть 401').to.be.equal(401);
    });
  });

  describe('запрос GET /api/orders должен', () => {
    before((done) => {
      server = app.listen(port, done);
    });

    beforeEach(async () => {
      await cleanUpDB();
    });

    after(async () => {
      await cleanUpDB();
      server.close();
    });

    it('вернуть список заказов текущего пользователя', async () => {
      const userData = {
        email: 'user@mail.com',
        displayName: 'user',
        password: '123123',
      };
      const token = 'token';
      const user = await createUserAndSession(userData, token);

      const categories = [
        {
          '_id': ObjectId('5d2f7e66a5a47618d7080a0f'),
          'title': 'Детские товары и игрушки',
          'subcategories': [
            {
              '_id': ObjectId('5d2f7e66a5a47618d7080a15'),
              'title': 'Прогулки и детская комната',
            },
          ],
        },
      ];

      await Category.insertMany(categories);

      const products = [
        {
          '_id': ObjectId('5d2f7e66a5a47618d7080a1f'),
          'title': 'Коляска Adamex Barletta 2 in 1',
          'description': 'description',
          'category': categories[0]._id,
          'subcategory': categories[0].subcategories[0]._id,
          'images': [
            'http://magazilla.ru/jpg_zoom1/598194.jpg',
          ],
          'price': 21230,
        },
        {
          '_id': ObjectId('5d2f7e66a5a47618d7080a2f'),
          'title': 'Коляска Peg Perego Si',
          'description': 'description',
          'category': categories[0]._id,
          'subcategory': categories[0].subcategories[0]._id,
          'images': [
            'http://magazilla.ru/jpg_zoom1/164281.jpg',
          ],
          'price': 15818,
        },
        {
          '_id': ObjectId('5d2f7e66a5a47618d7080a3f'),
          'title': 'Коляска Adamex Barletta 3 in 1',
          'description': 'description',
          'category': categories[0]._id,
          'subcategory': categories[0].subcategories[0]._id,
          'images': [
            'http://magazilla.ru/jpg_zoom1/1220903.jpg',
          ],
          'price': 26701,
        },
      ];

      await Product.insertMany(products);

      const orders = [
        {
          product: products[0]._id,
          phone: '1234567800',
          address: 'home',
          user: user.id,
        },
        {
          product: products[1]._id,
          phone: '1234567800',
          address: 'home',
          user: user.id,
        },
        // this order shouldn't be returned
        {
          product: products[2]._id,
          phone: '1234567800',
          address: 'home',
          user: ObjectId(),
        },
      ];

      await Order.insertMany(orders);

      const {data} = await request({
        method: 'get',
        url: serverURL,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(data.orders, 'ключ orders в ответе должел быть массивом').to.be.an('array');
      expect(data.orders, 'в ответе должно быть 2 заказа').to.have.lengthOf(2);
      expect(data.orders, 'ответ должен содержать только заказы текущего пользователя')
        .to.satisfy(() => data.orders.every((order) => order.user = user.id));
    });

    it('вернуть ошибку со статусом 401 если пользователь не авторизован', async () => {
      const {status} = await request({
        method: 'post',
        url: serverURL,
      });

      expect(status, 'статус код ответа должен быть 401').to.be.equal(401);
    });
  });
});
