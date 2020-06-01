## Онлайн-магазин (товары и категории)

### Получение списка категорий

Получение списка категорий логично поместить в файл `controllers/categories.js`. 
Сам запрос к базе данных выглядит следующим образом: `const categories = await Category.find();`, 
однако стоит помнить, что возвращать документы из базы данных в «сыром» виде не очень хорошо, 
стоит их всегда преобразовывать. Логику преобразования удобно поместить в `mappers/category.js`, 
чтобы в будущем была возможность вызывать эту функцию из других модулей тоже. 
Само преобразование достаточно просто: нам лишь необходимо оставить по 2 поля (`title` и `id`) в каждой из сущностей, 
не забыв конечно про то, что подкатегории хранятся в свойстве `subcategories` родительской категории.

```js

module.exports = function mapCategory(category) {
  return {
    id: category.id,
    title: category.title,
    subcategories: category.subcategories.map(subcategory => ({
      id: subcategory.id,
      title: subcategory.title,
    }))
  };
};

```

### Получение товаров

Получение товаров – очень частая операция в нашем приложении. Нам потребуется возвращать товары пользователю 
по выбранной подкатегории, по идентификатору, в будущем – по поисковому запросу и так далее. 
Следуя принципам паттерна «цепочка обязанностей» каждый конкретный случай имеет смысл определить в соответствующем 
обработчике, а затем объединить их всех в цепочку. Это позволит нам не усложнять каждый конкретный обработчик, 
а держать их небольшими, независимыми и легко менять при необходимости. 
Таким образом код роутера примет следующий вид:

```js

router.get('/products', productsBySubcategory, productList);
router.get('/products/:id', productById);

```

Где обработчик `productsBySubcategory` будет заниматься поиском товаров по подкатегории, 
`productList` просто возвращать 20 первых товаров из базы, а `productById` – возвращать товар по его идентификатору. 
В каждом из обработчиков на первом месте стоит расположить условие, проверяющее, стоит ли запрос обрабатывать в этом 
обработчике или надо передать управление «дальше».

### По подкатегории

Условие для выполнения обработчика должно проверять наличие параметра `subcategory` в запросе. 
Если этот параметр присутствует – значит необходимо выполнить запрос к базе данных и вернуть результат пользователю. 
Как и в предыдущем примере результат должен быть преобразован, «сырые» данные отдавать не стоит.

```js

module.exports.productsBySubcategory = async function productsBySubcategory(ctx, next) {
  const { subcategory } = ctx.query;
  if (!subcategory) return next();
};

```

Функцию преобразования поместим в файл `mappers/product.js`:

```js

module.exports = function mapProduct(product) {
  return {
    id: product.id,
    title: product.title,
    images: product.images,
    category: product.category,
    subcategory: product.subcategory,
    price: product.price,
    description: product.description,
  };
};

```

Получившийся код будет выглядеть следующим образом:

```js

module.exports.productsBySubcategory = async function productsBySubcategory(ctx, next) {
  const { subcategory } = ctx.query;
  if (!subcategory) return next();

  const products = await Product.find({subcategory: subcategory}).limit(20);
  ctx.body = { products: products.map(mapProduct) };
};

```

### Список товаров

Функция получения списка товаров намного проще, чем функция, которую мы рассмотрели до этого. 
В этом случае нам лишь необходимо выполнить запрос к базе без конкретных условий 
и вернуть массив товаров пользователю.

```js

module.exports.productList = async function productList(ctx, next) {
  const products = await Product.find().limit(20);
  ctx.body = { products: products.map(mapProduct) };
};

```

### По идентификатору

Поиск товара по идентификатору осуществляется с помощью функции `findById`, у модели `Product`. 
Эта функция принимает идентификатор документа и возвращает либо документ, либо `null`, если его нет в базе данных. 
Однако у этой функции есть одна особенность: в случае, если передан невалидный `id`, то эта функция выбросит ошибку. 
Для того, чтобы избежать ненужной обработки этой ошибки после вызова, мы можем заранее проверить переданный 
идентификатор на валидность с помощью метода `isValid` класса `mongoose.Types.ObjectId`. 
Таким образом на первом шаге проверим именно валидность идентификатора:

```js

module.exports.productById = async function productById(ctx, next) {
  if (!mongoose.Types.ObjectId.isValid(ctx.params.id)) {
    ctx.throw(400, 'invalid product id');
  }
};

```

Далее, выполним запрос к базе данных и убедимся в том, что документ действительно найден. 
Если документа нет – вернём ошибку `404`.

```js

module.exports.productById = async function productById(ctx, next) {
  if (!mongoose.Types.ObjectId.isValid(ctx.params.id)) {
    ctx.throw(400, 'invalid product id');
  }

  const product = await Product.findById(ctx.params.id);

  if (!product) {
    ctx.throw(404, `no product with ${ctx.params.id} id`);
  }
};

```

Последним шагом вернём полученный документ, не забыв вызвать функцию преобразования:

```js

module.exports.productById = async function productById(ctx, next) {
  if (!mongoose.Types.ObjectId.isValid(ctx.params.id)) {
    ctx.throw(400, 'invalid product id');
  }

  const product = await Product.findById(ctx.params.id);

  if (!product) {
    ctx.throw(404, `no product with ${ctx.params.id} id`);
  }

  ctx.body = { product: mapProduct(product) };
};

```
