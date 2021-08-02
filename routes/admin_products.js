var express = require('express');
var router = express.Router();
const flash = require('connect-flash');
const mkdirp = require('mkdirp');
const fs = require('fs-extra');
const resizeImg = require('resize-img');

var Product = require('../models/Product');
var Category = require('../models/Category');


/* GET products index. */
router.get('/', function(req, res, next) {
    if (req.app.locals.users.admin) {
        const messages = req.flash();
        var count;
        Product.countDocuments((err, c)=>{
            count = c;
        });
    
        Product.find((err, products)=>{
            res.render('admin/products',{
                products: products,
                count: count,
                messages
            });
        });
    
    } else {
      res.redirect('/')
    }
});

/* GET add products. */
router.get('/add-product', function(req, res, next) {
    if (req.app.locals.users.admin) {
        var title = '';
        var desc = '';
        var price = '';
    
        const messages = req.flash();
        Category.find((err, categories)=>{
            res.render('admin/add_product',{
                title: title,
                desc: desc,
                categories: categories,
                price: price,
                messages
            });
        });
    
    } else {
      res.redirect('/')
    }
});

/* POST add page. */
router.post('/add-product',function(req, res, next) {
    if (req.app.locals.users.admin) {
        let imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    
        const title = req.body.title;
        const slug = req.body.title;
        const desc = req.body.desc;
        const price = req.body.price;
        const category = req.body.category;
    
        if(!title || !desc || !price || !imageFile){
            if(!title){
                req.flash('error','Title must have a value');
            }
            if(!desc){
                req.flash('error','Description must have a value');
            }
            if(!price){
                req.flash('error','Price must have a value');
            }
            if(!imageFile){
                req.flash('error','Image must be uploaded');
            }
            res.redirect('/admin/products/add-product');
        }else{
            Product.findOne({slug: slug}, (product)=>{
            if(product){
                req.flash('error', 'Product title already exists, Choose another');
                res.redirect('/admin/products/add-product');
            }else{
                const price2 = parseInt(price);
    
                var products = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: price2,
                    category: category,
                    image: imageFile
                });
    
                products.save((err)=>{
                    if(err){
                        throw err;
                    }else{
                            mkdirp(`public/product_images/${products._id}`);
                            mkdirp(`public/product_images/${products._id}/gallery`);
                            mkdirp(`public/product_images/${products._id}/gallery/thumbs`);
    
                        if(req.files){
                            var file = req.files.image;
                            var filename = file.name;
                            file.mv('public/product_images/'+filename, (err)=>{
                                if (err) {
                                    console.log(err);
                                    req.flash('error', 'Image not saved');
                                    res.redirect('/admin/products/add-product');
                                }else{
                                    fs.rename(`public/product_images/${filename}`, `public/product_images/${products._id}/${filename}`, (err)=>{
                                        if(err){
                                            console.log(err);
                                        }else{
                                            console.log('rename complete');
                                        }
                                    });
                                    Product.find((err, products)=>{
                                        if (err) {
                                            throw err;
                                        }
                                    
                                        req.app.locals.products = products;
                                    });
                                    req.flash('success', 'Product added');
                                    res.redirect('/admin/products');
                                }
                            });
                        }
                    }
                });
            }
            });
        }
    
    } else {
      res.redirect('/')
    }
});


/* GET edit page. */
router.get('/edit-product/:id', function(req, res, next) {
    if (req.app.locals.users.admin) {
        const messages = req.flash();
    
        Product.findById(req.params.id, (err, product)=>{
            if(err) throw err;
    
            var galleryDir = `public/product_images/${product._id}/gallery`;
            var galleryImages = null;
    
            
            Category.find((err, categories)=>{
                fs.readdir(galleryDir, (err, files)=>{
                    if(err){
                        console.log(err);
                    }else{
                        galleryImages = files
    
                        res.render('admin/edit_product',{
                            id: product._id,
                            title: product.title,
                            slug: product.slug,
                            price: product.price,
                            desc: product.desc,
                            image: product.image,
                            category: product.category,
                            categories: categories,
                            galleryImages: galleryImages,
                            messages
                        });
                    }
                })
            })
        });
    
    } else {
      res.redirect('/')
    }
});

/* POST edit page. */
router.post('/edit-product/:id',async function(req, res, next) {
    if (req.app.locals.users.admin) {
        const title = req.body.title;
        const slug = req.body.title;
        const desc = req.body.desc;
        const price = req.body.price
        const category = req.body.category;
    
        const doc = await Product.findById(req.params.id);
        
        if(!title || !price || !desc){
            if(!title){
                req.flash('error','Title must have a value');
            }
            if(!price){
                req.flash('error','Price must have a value');
            }
            if(!desc){
                req.flash('error','Description must have a value');
            }
                res.redirect(`/admin/products/edit-product/${req.params.id}`);
        }else{
            Product.findOne({slug: slug, _id: {$ne : doc._id}}, (err, product)=>{
            if(err){
                console.log(err);
            }
    
            if(product){
                req.flash('error', 'Page slug already exists, Choose another');
                res.redirect(`/admin/products/edit-product/${req.params.id}`);
            }else{
                if(req.files){
                    let imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    
                    var file = req.files.image;
                    var filename = file.name;
                    file.mv('public/product_images/'+filename, (err)=>{
                        if (err) {
                            console.log(err);
                            req.flash('error', 'Image not saved');
                            res.redirect('/admin/products/add-product');
                        }else{
                            fs.unlink(`public/product_images/${doc._id}/${doc.image}`,(err)=>{
                                if(err){
                                    console.log('file not unlinked')
                                    throw err;
                                }
                            });
                            fs.rename(`public/product_images/${filename}`, `public/product_images/${doc._id}/${filename}`, (err)=>{
                                if(err){
                                    console.log(err);
                                }
                            });
                            const price2 = parseInt(price);
                            doc.updateOne({title: title, slug: slug, desc: desc, price: price2, category: category, image: imageFile}, (err)=>{
                                if (err) {
                                    console.log(err);
                                }
                                Product.find((err, products)=>{
                                    if (err) {
                                        throw err;
                                    }
                                
                                    req.app.locals.products = products;
                                });
                            });
                            req.flash('success', 'Product updated');
                            res.redirect('/admin/products');
                        }
                    });
                }else{
                    const price2 = parseInt(price);
                    doc.updateOne({title: title, slug: slug, desc: desc, price: price2, category: category}, (err)=>{
                        if (err) {
                            throw err;
                        }
                        Product.find((err, products)=>{
                            if (err) {
                                throw err;
                            }
                        
                            req.app.locals.products = products;
                        });
                    });
                    req.flash('success', 'Product updated');
                    res.redirect('/admin/products');
                }
                
            }
            });
            
        }
    
    } else {
      res.redirect('/')
    }
});

/* POST product gallery. */
router.post('/product-gallery/:id', function(req, res, next) {
    if (req.app.locals.users.admin) {
        var productImage = req.files.file;
        var id = req.params.id;
        var path = `public/product_images/${id}/gallery/${req.files.file.name}`;
        var thumsPath = `public/product_images/${id}/gallery/thumbs/${req.files.file.name}`;
    
        productImage.mv(path, (err)=>{
            if(err){
                console.log(err);
            }
            resizeImg(fs.readFileSync(path), {width: 180, height: 100}).then((buf)=>{
                fs.writeFileSync(thumsPath, buf);
            });
        });
        res.sendStatus(200);
    
    } else {
      res.redirect('/')
    }
});

/* GET delete image. */
router.get('/delete-image/:image', async function(req, res, next) {

    if (req.app.locals.users.admin) {
        var originalImage = `public/product_images/${req.query.id}/gallery/${req.params.image}`;
        var thumbImage = `public/product_images/${req.query.id}/gallery/thumbs/${req.params.image}`;
    
        fs.remove(originalImage, (err)=>{
            if(err){
                console.log(err);
            }else{
                fs.remove(thumbImage, (err)=>{
                    if (err) {
                        console.log(err);
                    }else{
                        Product.find((err, products)=>{
                            if (err) {
                                throw err;
                            }
                        
                            req.app.locals.products = products;
                        });
                        req.flash('success', 'Gallery image deleted');
                        res.redirect('/admin/products/edit-product/'+req.query.id);
                    }
                })
            }
        })
    
    } else {
      res.redirect('/')
    }
});

/* GET delete page. */
router.get('/delete-product/:id', async function(req, res, next) {
    if (req.app.locals.users.admin) {
        try {
            const id = req.params.id;
            const db = await Product.findById(id);
            
            fs.remove(`public/product_images/${db._id}`,(err)=>{
                if(err){
                    console.log(err);
                }else{
                    console.log('removed');
                }
            })
            
            await Product.deleteOne({_id: db._id}, (err)=>{
            if (err) {
                req.flash('error', 'Product not deleted');
            }else{
                req.flash('success', 'Product Successfully deleted');
            }
            res.redirect(`/admin/products`)
            });
        } catch (error) {
            console.log(error);
        }
    
    } else {
      res.redirect('/')
    }
});

module.exports = router;
