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

/*
# Сумма двух чисел

Для решения исходной задачи удобнее всего ее разбить на две подзадачи:

1. Написать код, который будет суммировать два числа.
1. Написать код, который будет проверять типы передаваемых значений.

## Суммирование двух чисел

Для получения суммы двух чисел воспользуемся оператором +, таким образом наш код будет
выглядеть так:

```js

// sum.js
function sum(a, b) {
  return a + b;
}

module.exports = sum;

```

Если мы теперь выполним тесты с помощью команды `npm run test:local 0-module 1-task`, то увидим,
что первый тест (проверяющий сумму чисел) – пройдет, значит наша первая подзадача решена успешно.


## Проверка типов

Однако остается вторая подзадача из условия – проверка типов передаваемых значений.
Нам необходимо удостовериться, что оба аргумента – числа.

Для проверки типа в JS существует операция typeof.
Применяя ее к аргументу мы получим строку, которая будет содержать имя типа передаваемого числа.
В данной задаче нам важно лишь проверить, что typeof от обоих аргументов – 'number''.
Если строка будет другой (нам неважно в данной задаче какой именно) – нам необходимо
бросить ошибку TypeError. В результате код будет выглядеть таким образом:

```js

function sum(a, b) {
  if ([a, b].some((value) => typeof value !== 'number')) {
    throw new TypeError();
  }

  return a + b;
}

module.exports = sum;

```

Теперь оба теста проходят – мы нашли решение задачи и можем отправлять его на проверку.

 */
