const express = require('express');
const router = express.Router();
const User = require('../models/user');

let username = '';
let articles = [];

const articlesAndUsername = ()=>{
    return { articles: articles, username: username };
}

router.post('/', (req, res)=>{ //get the user data
    const passedUsername = req.body.username;
    console.log(passedUsername);
    //res.render('user/index', { username: passedUsername } );
    User.findOne({username: passedUsername}, (err, user)=>{
        if(user){
            username = passedUsername;
            console.log(user.articles);
            articles = user.articles;
            res.redirect(`/${username}/articles`);   
        }  
    })
});

router.get('/articles', (req, res)=>{
    console.log('hey');
    res.render('user/index', articlesAndUsername());
})


module.exports = router;