var express = require('express');
var router = express.Router();

const Product = require('../models/Product');

/* GET add to cart. */
router.get('/add/:product',function(req, res, next) {
  const slug = req.params.product;

  Product.findOne({slug: slug}, (err, p)=>{
    if(err){
      throw err;
    }

    if(typeof req.session.cart == "undefined"){
      req.session.cart = [];
      req.session.cart.push({
        title: slug,
        qty: 1,
        price: parseInt(p.price),
        image: `/product_images/${p._id}/${p.image}`
      });
    }else{
      var cart = req.session.cart;
      var newItem = true;

      for(var i = 0; i < cart.length; i++) {
        if(cart[i].title == slug){
          cart[i].qty++;
          newItem = false;
          break;
        }
      }

      if(newItem){
        cart.push({
          title: slug,
          qty: 1,
          price: parseInt(p.price),
          image: `/product_images/${p._id}/${p.image}`
        });
      }
    }
    req.app.locals.cart = req.session.cart;
    req.flash('success', 'product added to cart');
    res.redirect('back');
  });
});

// get cart checkout
router.get('/checkout',function(req, res, next) {
  const messages = req.flash();
  if (req.session.cart && req.session.cart.length == 0) {
    delete req.session.cart;
    res.redirect('/cart/checkout');
  }else{
    res.render('checkout',{
      title: 'Your Cart',
      cart: req.session.cart,
      messages
    });
  }
});

// get update product
router.get('/update/:product',function(req, res, next) {
  const slug = req.params.product;
  var cart = req.session.cart;
  const action = req.query.action;
  console.log(slug);

  for (var i = 0; i < cart.length; i++) {
    if( cart[i].title === slug){
      if(action === "add"){
        cart[i].qty = cart[i].qty + 1;
        const element = cart[i];
        console.log(cart);
      }else if(action === "remove"){
        cart[i].qty = cart[i].qty - 1;
        if (cart[i].qty < 1) {
          cart.splice(i, 1);
        }
      }else if(action === "clear"){
        cart.splice(i, 1);
        if(cart.length == 0) delete req.session.cart;
      }

      req.app.locals.cart = cart;
      req.flash('success', 'Cart Updated');
      res.redirect('/cart/checkout');
    }
  }
});

// get clear cart
router.get('/clear',function(req, res, next) {
  delete req.session.cart;
  req.app.locals.cart = req.session.cart;

  req.flash('success', 'Cart Cleared');
  res.redirect('/cart/checkout');
});



module.exports = router;
