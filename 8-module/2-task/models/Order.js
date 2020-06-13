const mongoose = require('mongoose');
const connection = require('../libs/connection');

const orderSchema = new mongoose.Schema({
});

module.exports = connection.model('Order', orderSchema);
