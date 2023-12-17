// req.body should look like this...
// {
//   product_name: "Basketball",
//   price: 200.00,
//   stock: 3,
//   tagIds: [1, 2, 3, 4]
// }
const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// GET all products
router.get('/', (req, res) => {
  Product.findAll({
    include: [
      { model: Category },
      { model: Tag, through: ProductTag }
    ]
  })
    .then((products) => res.json(products))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// GET one product
router.get('/:id', (req, res) => {
  Product.findOne({
    where: { id: req.params.id },
    include: [
      { model: Category },
      { model: Tag, through: ProductTag }
    ]
  })
    .then((product) => {
      if (!product) {
        res.status(404).json({ message: 'No product found with this id' });
        return;
      }
      res.json(product);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// POST create new product
router.post('/', (req, res) => {
  Product.create(req.body)
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      res.status(201).json(product);
    })
    .then((productTagIds) => res.status(201).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// PUT update product
router.put('/:id', (req, res) => {
  Product.update(req.body, {
    where: { id: req.params.id },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {
        ProductTag.findAll({ where: { product_id: req.params.id } })
          .then((productTags) => {
            const productTagIds = productTags.map(({ tag_id }) => tag_id);
            const newProductTags = req.body.tagIds
              .filter((tag_id) => !productTagIds.includes(tag_id))
              .map((tag_id) => {
                return {
                  product_id: req.params.id,
                  tag_id,
                };
              });
            const productTagsToRemove = productTags
              .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
              .map(({ id }) => id);
            return Promise.all([
              ProductTag.destroy({ where: { id: productTagsToRemove } }),
              ProductTag.bulkCreate(newProductTags),
            ]);
          });
      }
      res.json(product);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// DELETE one product
router.delete('/:id', (req, res) => {
  Product.destroy({
    where: { id: req.params.id },
  })
    .then((product) => {
      if (!product) {
        res.status(404).json({ message: 'No product found with this id' });
        return;
      }
      res.json(product);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
