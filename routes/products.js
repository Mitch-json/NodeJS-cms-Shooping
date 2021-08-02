var express = require('express');
var router = express.Router();
const fs = require('fs-extra');
const Product = require('../models/Product');
const Category = require('../models/Category');

/* GET all products */
router.get('/', function(req, res, next) {
    const messages = req.flash();
    Product.find((err, products)=>{
        if(err){
            throw err;
        }

        res.render('all_products', {
            title: 'All Products',
            products: products,
            messages
        });
    });
});

/* GET products by category */
router.get('/:category', function(req, res, next) {
    const messages = req.flash();
    const categorySlug = req.params.category;

    Category.findOne({slug: categorySlug}, (err, cat)=>{
        Product.find({category: categorySlug},(err, products)=>{
            if(err){
                throw err;
            }
    
            res.render('cat_products', {
                title: cat.title,
                products: products,
                messages
            });
        });
    });
});

router.get('/:category/:product', function(req, res, next) {
    const messages = req.flash();

    var galleryImages = null;

    Product.findOne({slug: req.params.product}, (err, product)=>{
        if (err) {
            throw err;
        }

        var galleryDir = `public/product_images/${product._id}/gallery`;

        fs.readdir(galleryDir, (err, files)=>{
            if (err) {
                throw err;
            }

            galleryImages = files;

            res.render('product', {
                title: product.title,
                product: product,
                galleryImages: galleryImages,
                messages
            });
        });
    });
});


module.exports = router;
