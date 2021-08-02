var express = require('express');
var router = express.Router();
const User = require('../models/User');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash')

/* GET Register page. */
router.get('/register',function(req, res, next) {
  const messages = req.flash();

  res.render('register', {
    title: 'Register',
    messages
  });
});

router.post('/register', (req, res, next)=>{
  const name = req.body.name
  const email = req.body.email
  const username = req.body.username
  const password = req.body.password
  const password2 = req.body.password2

  if(!name || !email || !username || !password || !password2){
    req.flash('error','Please ensure you input all fields');
    res.redirect('/users/register')
  }else{
    if (password != password2) {
      req.flash('error', 'Passwords do not match')
    } else {
      User.findOne({email: email}, (err, user)=>{
        if (err) {
          console.log(err)
          req.flash('error', 'Error occured, please try again later')
          res.redirect('/users/register')
        }else{
          if (user) {
            req.flash('error', 'Email adrress already exists')
            res.redirect('/users/register')
          } else {
            bcrypt.genSalt(10, function(err, salt) {
              bcrypt.hash(password, salt, function(err, hash) {
                  var newUser;
      
                  if (email == "mitchjaga@gmail.com") {
                    newUser = new User({
                      name: name,
                      email: email,
                      username: username,
                      password: hash,
                      admin: 100
                    })
                    
                  } else {
                    newUser = new User({
                      name: name,
                      email: email,
                      username: username,
                      password: hash
                    }) 
                  }
      
                  newUser.save(err =>{
                    if (err) {
                      console.log(err)
                      req.flash('error', 'Error occured, please try again later')
                      res.redirect('/users/register')
                    } else {
                      req.flash('success', 'User successfully registered')
                      res.redirect('/users/register')
                    }
                  })
              });
            });


          }
        }
      })
    }
  }
})

router.get('/login',function(req, res, next) {
  const messages = req.flash();

  res.render('login', {
    title: 'Sign In',
    messages
  });
});

router.post('/login',(req, res, next)=>{
  const email = req.body.email
  const password = req.body.password
  User.findOne({email: email}, (err, user)=>{
    if (err) {
        throw err;
    }

    if(!user){
      req.flash('error', 'User does not Exist')
      res.redirect('/users/login')
    }

    bcrypt.compare(password, user.password, (err, isMatch)=>{
        if (err) {
            throw err;
        }
            
        if (isMatch) {
            if (user.admin) {
              req.app.locals.users = user
              res.redirect('/admin/pages')
            } else {
              req.app.locals.users = user
              res.redirect('/')
            }
        } else {
            req.flash('error', "Wrong Username or Password")
            res.redirect('/users/login')
        }
    });
  });
});

router.get('/logout', (req, res)=>{
  req.app.locals.users = undefined
  res.redirect('/')
})


module.exports = router;
