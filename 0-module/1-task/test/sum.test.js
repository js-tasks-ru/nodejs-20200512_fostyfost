const sum = require('../sum');
const expect = require('chai').expect;

describe('0-module-1-task', () => {
  describe('функция sum', () => {
    it('складывает два числа', () => {
      expect(sum(1, 2)).to.equal(3);
    });

    it('бросает TypeError если аргументы - не числа', () => {
      expect(() => sum('1', [])).throw(TypeError);
    });
  });
});
