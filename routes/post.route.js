var express = require('express');
var categoryModel = require('../models/category.model')
var postModel = require('../models/post.model');
var router = express.Router();

router.get('/:id', (req, res, next) => {
    var id = req.params.id;

    Promise.all([
        postModel.single(id), 
        postModel.relatedPost(id),
    ]).then(([post, relatedPost]) => {
        console.log(post[0].postid);
        var entity = {
            postid: post[0].postid,
            views: post[0].views + 1
        }
        postModel.update(entity);
    
        res.render('post', { post: post[0], others: relatedPost})
    })
      .catch(next)
});

router.post('/:id', (req, res, next) => {
    var searchString = req.body.search;
    console.log(searchString);
    var posts = postModel.getPostsBySearchString(searchString);
    posts.then(rows => {
        res.render('reader/search', { posts: rows, search: searchString });
    }).catch(err => {
        console.log(err);
        next
    })
});

module.exports = router;