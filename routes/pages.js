var express = require('express');
var router = express.Router();
const Page = require('../models/Page');

/* GET home page. */
router.get('/',function(req, res, next) {
  const messages = req.flash();
  
  Page.findOne({slug: 'home-page'}, (err, page)=>{
    if(err){
      throw err;
    }

      res.render('index', {
        title: page.title, 
        content: page.content,
        messages
      });
    
  });
});

router.get('/:slug',(req, res, next)=>{
  const slug = req.params.slug;
  const messages = req.flash();

  Page.findOne({slug: slug}, (err, page)=>{
    if(err){
      throw err;
    }

    if(!page){
      res.redirect('/');
    }else{
      res.render('index', {
        title: page.title, 
        content: page.content,
        messages
      });
    }
  });
});

module.exports = router;
