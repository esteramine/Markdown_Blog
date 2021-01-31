const express = require('express');
const router = express.Router();
const User = require('../models/user');

const marked = require('marked'); //to convert markdown to text
const createDomPurify = require('dompurify');
const {JSDOM} = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);

const indexPageElements = (username, active = 0, articles)=>{
    return { articles: articles, username: username, active: active };
}

const articleElements = (username, active = 0, article = {title: '', summary: '', markdown: '', sanitizedHtml: '', createdAt: Date.now()})=>{
    return { article: article, username: username, active: active };
}

router.post('/', (req, res)=>{ //get the user data
    const passedUsername = req.body.username;
    //res.render('user/index', { username: passedUsername } );
    User.findOneAndUpdate({username: passedUsername},{ $set:{login:true} }, (err, user)=>{
        if(user){
            res.redirect(`/blog/${passedUsername}/articles`);   
        }  
    });
});

router.get('/:username/home', (req, res)=>{
    const username = req.params.username;
    res.redirect(`/blog/${username}/articles`); 
});

router.get('/:username/logout', (req, res)=>{
    const passedUsername = req.params.username;
    User.findOneAndUpdate({username: passedUsername},{ $set:{login:false} }, (err, user)=>{
        if(user){
            res.redirect('/');   
        }  
    });
});

router.get('/:username/articles', (req, res)=>{
    console.log(req.params.username);
    User.findOne({username: req.params.username}, (err, user)=>{
        if(user.login){
            res.render('user/index', indexPageElements(user.username, 0, user.articles.sort((a, b)=>{return b.createdAt - a.createdAt})));
        }
        else{
            res.redirect('/');
        }   
    });
});

router.get('/:username/articles/new', (req, res)=>{
    console.log(req.params.username);
    User.findOne({username: req.params.username}, (err, user)=>{
        if(user.login){
            res.render('article/new', articleElements(user.username, 1));
        }
        else{
            res.redirect('/');
        }   
    });
});

//create an acticle 
router.post('/:username/articles/new', (req, res)=>{
    const passedUsername = req.params.username;
    const sanitizedHtml = dompurify.sanitize(marked(req.body.markdown));
    const article = {
        title: req.body.title,
        summary: req.body.summary,
        markdown: req.body.markdown,
        sanitizedHtml: sanitizedHtml
    };
    try{
        User.findOneAndUpdate({username: passedUsername}, { $push: { articles: [article] } }, { new: true }, (err, user)=>{ //retrun updated document
            const articles = user.articles;
            console.log(articles[articles.length-1]._id);
            res.redirect(`/blog/${passedUsername}/articles/${articles[articles.length-1]._id}`); //redirect to the page of the article created (router.get('/:id'))
        });

    }catch(e){
        res.render('article/new', articleElements(user.username, 1, article)); //still remain on the new article page (the article parameter is prefilling the previous info the user keyed in)
    } 
});

//display article
router.get('/:username/articles/:id', (req, res)=>{
    const username = req.params.username;
    const id = req.params.id;
    User.findOne({username: username}, (err, user)=>{
        const articles = user.articles;
        for(var i = 0; i < articles.length; ++i){
            if (articles[i]._id == id){
                const article = articles[i];
                res.render('article/display', articleElements(user.username, 0, article));
                break;
            }
        }
    });
});

//edit article
router.get('/:username/articles/edit/:id', (req, res)=>{
    const username = req.params.username;
    const id = req.params.id;
    User.findOne({username: username}, (err, user)=>{
        const articles = user.articles;
        for(var i = 0; i < articles.length; ++i){
            if (articles[i]._id == id){
                const article = articles[i];
                res.render('article/edit', articleElements(user.username, 0, article));
                break;
            }
        }
    });
});

//edit article
router.post('/:username/articles/edit/:id', (req, res)=>{
    const username = req.params.username;
    const id = req.params.id;
    const sanitizedHtml = dompurify.sanitize(marked(req.body.markdown));
    const passedArticle = {
        title: req.body.title,
        summary: req.body.summary,
        markdown: req.body.markdown,
        sanitizedHtml: sanitizedHtml
    };

    User.findOneAndUpdate(
        {username: username, 'articles._id': id}, 
        { $set: {
            'articles.$.title': passedArticle.title,
            'articles.$.summary': passedArticle.summary,
            'articles.$.markdown': passedArticle.markdown,
            'articles.$.sanitizedHtml': passedArticle.sanitizedHtml } }, 
        { select: { articles: {$elemMatch: {_id: id}}}, new: true },
        (err, result)=>{
            res.render('article/display', articleElements(username, 0, result.articles[0])); }
    );
});

//delete article
router.delete('/:username/articles/:id', (req, res)=>{
    const username = req.params.username;
    const id = req.params.id;
    User.updateOne({username: username}, { $pull: {'articles': {_id: id} } }, (err, result)=>{
        res.redirect(`/blog/${username}/articles`);
    });  
});


module.exports = router;