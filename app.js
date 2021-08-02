var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const passport = require('passport');
const User = require('./models/User');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

dotenv.config();

var pagesRouter = require('./routes/pages');
var productsRouter = require('./routes/products');
var cart = require('./routes/cart');
var users = require('./routes/users');
var adminPages = require('./routes/admin_pages');
var adminCategoies = require('./routes/admin_categories');
var adminProducts = require('./routes/admin_products');

var app = express();

mongoose.connect(process.env.DB_CONNECT,{ 
  useNewUrlParser: true , useUnifiedTopology: true },()=>{
  console.log('connected to DB');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('_layouts', path.join(__dirname, 'views/_layouts'));
app.set('view engine', 'ejs');

//Global variables
const Page = require('./models/Page');
Page.find({}).sort({sorting: 1}).exec((err, pages)=>{
  if (err) {
    throw err;
  }

  app.locals.pages = pages;
});

const Category = require('./models/Category');
Category.find((err, categories)=>{
  if (err) {
    throw err;
  }

  app.locals.categories = categories;
});

const Product = require('./models/Product');
Product.find((err, products)=>{
  if (err) {
      throw err;
  }

  app.locals.products = products;
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(session({
  secret: 'session secret',
  resave: true,
  saveUninitialized: true
}));
app.use(fileUpload());
app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy((email, password, done)=>{
  User.findOne({email: email}, (err, user)=>{
      if (err) {
          throw err;
      }

      if(!user){
          return done(null, false);
      }

      console.log(user) 

      bcrypt.compare(password, user.password, (err, isMatch)=>{
          if (err) {
              throw err;
          }
              
          if (isMatch) {
              return done(null, user);
          } else {
              console.log("error")
              return done(null, false);
          }
      });
  });
}));

passport.serializeUser((user, done)=>{
  done(null, user._id);
});

passport.deserializeUser((id, done)=>{
  User.findById(id, (err, user)=>{
      done(err, user);
  });
});


app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategoies);
app.use('/admin/products', adminProducts);
app.use('/products', productsRouter);
app.use('/cart', cart);
app.use('/users', users);
app.use('/', pagesRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const PORT = process.env.PORT || 2000;

app.listen(PORT, ()=>{
    console.log('Server running on http://localhost:'+ PORT);
});

module.exports = app;
