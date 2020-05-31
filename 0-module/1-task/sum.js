function isNumber(value) {
  return typeof value === 'number';
}

function sum(a, b) {
  const firsArgIsNumber = isNumber(a);
  const secondArgIsNumber = isNumber(b);

  switch (true) {
    case !firsArgIsNumber && !secondArgIsNumber: {
      throw new TypeError('Both arguments are not numbers.');
    }

    case !firsArgIsNumber: {
      throw new TypeError('The first argument is not a number.');
    }

    case !secondArgIsNumber: {
      throw new TypeError('The second argument is not a number.');
    }

    default: {
      return a + b;
    }
  }
}

module.exports = sum;
