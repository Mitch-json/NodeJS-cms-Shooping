var express = require('express');
var router = express.Router();
const flash = require('connect-flash');
var Category = require('../models/Category');

/* GET categories index. */
router.get('/', function(req, res, next) {
  if (req.app.locals.users.admin) {
    const messages = req.flash();
  
    Category.find((err, categories)=>{
      res.render('admin/categories',{categories: categories, messages});
    });
    
  } else {
    res.redirect('/')
  }
});

/* GET add category. */
router.get('/add-category', function(req, res, next) {
  if (req.app.locals.users.admin) {
    var title = '';
  
    const messages = req.flash();
  
    res.render('admin/add_category',{
      title: title,
      messages
    });
    
  } else {
    res.redirect('/')
  }
});

/* POST add page. */
router.post('/add-category',function(req, res, next) {

  if (req.app.locals.users.admin) {
    const title = req.body.title;
    const slug = req.body.title;
  
    if(!title){
      if(!title){
        req.flash('error','Title must have a value');
      }
      res.redirect('/admin/categories/add-category');
    }else{
      Category.findOne({slug: slug}, (err, category)=>{
        if(err){
          console.log(err);
        }
  
        if(category){
          req.flash('error', 'Category title already exists, Choose another');
          res.redirect('/admin/categories/add-category');
        }else{
          var categories = new Category({
            title: title,
            slug: slug
          });
  
          categories.save((err)=>{
            if(err){
              throw err;
            }else{
              Category.find((err, categories)=>{
                if (err) {
                  throw err;
                }
              
                req.app.locals.categories = categories;
              });
              req.flash('success', 'Category added');
              res.redirect('/admin/categories/add-category');
            }
          });
        }
      });
    }
    
  } else {
    res.redirect('/')
  }
});


/* GET edit category. */
router.get('/edit-category/:id', function(req, res, next) {
  if (req.app.locals.users.admin) {
    const messages = req.flash();
  
    Category.findById(req.params.id, (err, category)=>{
      if(err) return console.log(err);
  
      res.render('admin/edit_category',{
        title: category.title,
        slug: category.slug,
        id: category._id,
        messages
      });
    });
    
  } else {
    res.redirect('/')
  }
});

/* POST edit category. */
router.post('/edit-category/:id',async function(req, res, next) {
  if (req.app.locals.users.admin) {
    const title = req.body.title;
    const slug = req.body.title;
    const id = req.params.id;
  
    const doc = await Category.findById(id);
    
    if(!title){
      if(!title){
        req.flash('error','Title must have a value');
      }
      res.redirect(`/admin/categories/edit-category/${id}`);
    }else{
      Category.findOne({slug: slug, _id: {$ne : doc._id}}, (err, category)=>{
        if(err){
          console.log(err);
        }
  
        if(category){
          req.flash('error', 'Category title already exists, Choose another');
          res.redirect(`/admin/categories/edit-category/${id}`);
        }else{
          doc.updateOne({title: title, slug: slug}, (err)=>{
            if (err) {
              throw err;
            }
            Category.find((err, categories)=>{
              if (err) {
                throw err;
              }
            
              req.app.locals.categories = categories;
            });
  
            req.flash('success', 'Category Successfully Updated');
            res.redirect(`/admin/categories/edit-category/${id}`);
          });
        }
      });
      
    }
    
  } else {
    res.redirect('/')
  }
});

/* GET delete page. */
router.get('/delete-category/:slug', async function(req, res, next) {
  if (req.app.locals.users.admin) {
    try {
      const slug = req.params.slug;
      const db = await Category.findOne({slug: slug});
        
      await Category.deleteOne({_id: db._id}, (err)=>{
        if (err) {
          req.flash('error', 'Category not deleted');
        }else{
          Category.find((err, categories)=>{
            if (err) {
              throw err;
            }
          
            req.app.locals.categories = categories;
          });
  
          req.flash('success', 'Category Successfully deleted');
        }
        res.redirect(`/admin/categories`);
      });
    } catch (error) {
      console.log(error);
    }
    
  } else {
    res.redirect('/')
  }
});

module.exports = router;
