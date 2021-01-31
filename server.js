require('dotenv-defaults').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const userBlogRouter = require('./routes/userBlog');
const saltRounds = 10;

let port = process.env.PORT || 4000;

//mongodb set up
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useCreateIndex: true
} );
mongoose.set('useFindAndModify', false);
const db = mongoose.connection;
db.on('error', (error) => {
    console.error(error)
});
db.once('open', () => {
    console.log('MongoDB connected!')
});

//set up the view engine
app.set('view engine', 'ejs');

//set up url encoder (body-parser)
app.use(express.urlencoded({ extended:true }));

//set up method override (for delete)
app.use(methodOverride('_method'));


const signInUpReturnText= (displayText='', userText={username:'', password:''})=>{
    return {displayText: displayText, user: userText};
}

//homepage - login
app.get('/', (req, res)=>{
    res.render('login', signInUpReturnText() );
});

//sign up routes start
app.get('/signUp', (req, res)=>{
    res.render('signUp', signInUpReturnText());
});
app.post('/signUpCheck', (req, res)=>{
    const setPassword = req.body.password;
    if (setPassword == req.body.passwordCheck){ //confirm password is the same
        bcrypt.hash(setPassword, saltRounds, (err, hash)=>{
            let user = new User({
                username: req.body.username,
                hashedPassword: hash
            });
            console.log(setPassword);
            console.log(hash);

            // store the user to db
            User.find({username: user.username}, (err, docs)=>{
                if(docs.length){ //username exist, return to sign up page and show 'username exist'
                    console.log('user exists');
                    res.render('signUp', signInUpReturnText('Username exists! Have you signed up before? If you have not, please think of another username!', user));
                }
                else{  //the username does not exist
                    user.save(); //store user data
                    console.log(user.username);
                    res.redirect(307, `/blog`);
                }
            });
        });
    }
    else{ //confirm password is wrong, directly return to the sign up page again and show 'password not the same' message
        res.render('signUp', signInUpReturnText('Confirm password is wrong!', {username: req.body.username, password: setPassword}));
    }

});
//sign up routes end

//login routes start
app.post('/loginCheck', (req, res)=>{
    const user = {
        username: req.body.username,
        password: req.body.password
    };
    User.findOne({username: user.username}, (err, checkUser)=>{
        if (!checkUser){// username does not exists, redirect and output message "username does not exist, please check or signup"
            console.log("username does not exist");
            res.render('login', signInUpReturnText('Username does not exist!', user)); 
        }
        else{ //username exists, check password
            bcrypt.compare(user.password, checkUser.hashedPassword, (err, result)=>{
                if (result){ //password correct
                    res.redirect(307, `/blog`);
                }
                else{ //wrong password
                    console.log("wrong password");
                    res.render('login', signInUpReturnText('Wrong Password!', user));
                }
            });
        }
    });

});
//login routes end

app.listen(port);

app.use('/blog', userBlogRouter);
//everything in userBlogRouter (userBlog.js) is based on '/:username', so don't need to specify '/:username' again in userBlog.js, just '/' is enough