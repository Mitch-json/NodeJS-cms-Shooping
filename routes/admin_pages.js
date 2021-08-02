var express = require('express');
var router = express.Router();
const flash = require('connect-flash');
var Page = require('../models/Page');
const ObjectId = require('mongodb').ObjectID;
const { locals } = require('../app');

/* GET pages index. */
router.get('/', function(req, res, next) {
  if (req.app.locals.users.admin) {
    const messages = req.flash();
    
    Page.find({}).sort({sorting: 1}).exec((err, pages)=>{
      res.render('admin/pages', { pages: pages, messages});
    });
  } else {
    res.redirect('/')
  }
});

/* GET add page. */
router.get('/add-page', function(req, res, next) {
  if (req.app.locals.users.admin) {
    var title = '';
    var slug = '';
    var content = '';
  
    const messages = req.flash();
  
    res.render('admin/add_page',{
      title: title,
      slug: slug,
      content: content,
      messages
    });
  } else {
    res.redirect('/')
  }
});

/* POST add page. */
router.post('/add-page',function(req, res, next) {
  if (req.app.locals.users.admin) {
    const title = req.body.title;
    const slug = req.body.slug;
    const content = req.body.content;
  
    if(!title || !slug || !content){
      if(!title){
        req.flash('error','Title must have a value');
      }
      if(!slug){
        req.flash('error','Slug must have a value');
      }
      if(!content){
        req.flash('error','Content must have a value');
      }
      res.redirect('/admin/pages/add-page');
    }else{
      Page.findOne({slug: slug}, (err, page)=>{
        if(err){
          console.log(err);
        }
  
        if(page){
          req.flash('error', 'Page slug already exists, Choose another');
          res.redirect('/admin/pages/add-page');
        }else{
          var pages = new Page({
            title: title,
            slug: slug,
            content: content,
            sorting: 100
          });
  
          pages.save((err)=>{
            if(err){
              throw err;
            }else{
              Page.find({}).sort({sorting: 1}).exec((err, pages)=>{
                if (err) {
                  throw err;
                }
              
                req.app.locals.pages = pages;
              });
  
              req.flash('success', 'Page added');
              res.redirect('/admin/pages/add-page');
            }
          });
        }
      });
    }
  } else {
    res.redirect('/')
  }
});

//sort pages
function sortPages(ids, callback){
  var count = 0;

  for (let i = 0; i < ids.length; i++) {
    var id = ids[i];
    count ++;

    (function(count) {
      Page.findById(id, (err, page)=>{
        page.sorting = count;
        page.save((err)=>{
          if(err){
            return console.log(err);
          }
          ++count;
          if (count >= ids.length) {
            callback();
          }
        });
      });
    })(count);
  }
}


// Post reorder pages

router.post('/reorder-pages', function(req, res, next) {
  var ids = req.body['id[]'];

  sortPages(ids, ()=>{
    Page.find({}).sort({sorting: 1}).exec((err, pages)=>{
      if (err) {
        throw err;
      }
    
      req.app.locals.pages = pages;
    });
  });
});

/* GET edit page. */
router.get('/edit-page/:id', function(req, res, next) {
  
  if (req.app.locals.users.admin) {
    const messages = req.flash();
  
    Page.findById(req.params.id , (err, page)=>{
      if(err) return console.log(err);
  
      res.render('admin/edit_page',{
        id: page._id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        messages
      });
    });
    
  } else {
    res.redirect('/')
  }
});

/* POST edit page. */
router.post('/edit-page/:id',async function(req, res, next) {

  
  if (req.app.locals.users.admin) {
    const title = req.body.title;
    const slug = req.body.slug;
    const content = req.body.content;
    const id = req.params.id
  
    const doc = await Page.findById(id);
    
    if(!title || !slug || !content){
      if(!title){
        req.flash('error','Title must have a value');
      }
      if(!slug){
        req.flash('error','Slug must have a value');
      }
      if(!content){
        req.flash('error','Content must have a value');
      }
      res.redirect(`/admin/pages/edit-page/${slug}`);
    }else{
      Page.findOne({slug: slug, _id: {$ne : doc._id}}, (err, page)=>{
        if(err){
          console.log(err);
        }
  
        if(page){
          req.flash('error', 'Page slug already exists, Choose another');
          res.redirect(`/admin/pages/edit-page/${id}`);
        }else{
          
          doc.updateOne({title: title, slug: slug, content: content}, (err)=>{
            if (err) {
              throw err;
            }
            Page.find({}).sort({sorting: 1}).exec((err, pages)=>{
              if (err) {
                throw err;
              }
            
              req.app.locals.pages = pages;
            });
  
            req.flash('success', 'Page Successfully Updated');
            res.redirect(`/admin/pages/edit-page/${id}`);
          });
  
        }
      });
      
    }
    
  } else {
    res.redirect('/')
  }
});

/* GET delete page. */
router.get('/delete-page/:slug', async function(req, res, next) {
  if (req.app.locals.users.admin) {
    try {
      const slug = req.params.slug;
      const db = await Page.findOne({slug: slug});
        
      await Page.deleteOne({_id: db._id}, (err)=>{
        if (err) {
          req.flash('error', 'Page not deleted');
        }else{
          Page.find({}).sort({sorting: 1}).exec((err, pages)=>{
            if (err) {
              throw err;
            }
          
            req.app.locals.pages = pages;
          });
  
          req.flash('success', 'Page Successfully deleted');
        }
        res.redirect(`/admin/pages`)
      });
    } catch (error) {
      console.log(error);
    }
    
  } else {
    res.redirect('/')
  }
});

module.exports = router;
