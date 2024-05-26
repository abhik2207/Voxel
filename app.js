const express = require('express');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const UserModel = require('./models/User');
const PostModel = require('./models/Post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get('/', isLoggedIn, async (req, res) => {
    const posts = await PostModel.find().populate("user");  // This is how we populate a referenced field
    const user = await UserModel.findOne({ _id: req.user.userId }).populate("posts");  // This is how we populate a referenced field
    console.log(posts);

    console.log(chalk.hex('#03befc').bold("~ Homepage loaded!"));
    res.render("index.ejs", { posts, user });
});

app.get('/login', (req, res) => {
    console.log(chalk.hex('#03befc').bold("~ Login page loaded!"));
    res.render("login.ejs");
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const existingUser = await UserModel.findOne({ email: email });
    if (!existingUser) {
        console.log(chalk.hex('#03befc').bold("~ No user with that email!"));
        return res.render("invalid.ejs");
    }
    else {
        bcrypt.compare(password, existingUser.password, function (err, result) {
            if (result) {
                const token = jwt.sign({ email: email, userId: existingUser._id }, 'MonkeysCanBreathe');
                res.cookie("token", token);

                console.log(chalk.hex('#03befc').bold("~ Logged in an user!"));
                return res.redirect("/profile");
            }
            else {
                console.log(chalk.hex('#03befc').bold("~ Wrong email or password combination!"));
                return res.render("invalid.ejs");
            }
        });
    }
});

app.get('/signup', (req, res) => {
    console.log(chalk.hex('#03befc').bold("~ Signup page loaded!"));
    res.render("signup.ejs");
});

app.post('/register', async (req, res) => {
    const { name, username, age, password, email, phone } = req.body;

    const existingUser = await UserModel.findOne({ email: email });
    if (existingUser) {
        console.log(chalk.hex('#03befc').bold("~ User already exists!"));
        return res, status(500).send("User already exists!");
    }
    else {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
                const createdUser = await UserModel.create({ name, age, username, password: hash, email, phone });

                const token = jwt.sign({ email: email, userId: createdUser._id }, 'MonkeysCanBreathe');
                res.cookie("token", token);

                console.log(chalk.hex('#03befc').bold("~ Created an user!"));
                res.redirect('/profile');
            });
        });
    }
});

app.get('/logout', (req, res) => {
    console.log(chalk.hex('#03befc').bold("~ Logged out successfully!"));
    res.cookie("token", "");
    res.redirect("/login");
});

app.get('/profile', isLoggedIn, async (req, res) => {
    const user = await UserModel.findOne({ _id: req.user.userId }).populate("posts");  // This is how we populate a referenced field

    console.log(chalk.hex('#03befc').bold("~ Profile page loaded!"));
    res.render("profile.ejs", { user });
});

app.post('/post', isLoggedIn, async (req, res) => {
    const user = await UserModel.findOne({ email: req.user.email });
    const { content, title } = req.body;

    const createdPost = await PostModel.create({ user: user._id, content, title });

    user.posts.push(createdPost._id);
    await user.save();

    console.log(chalk.hex('#03befc').bold("~ Created a post!"));
    res.redirect("/profile");
});

app.get('/like/:id', isLoggedIn, async (req, res) => {
    const post = await PostModel.findOne({ _id: req.params.id }).populate("user");  // This is how we populate a referenced field

    if (post.likes.indexOf(req.user.userId) === -1) {
        post.likes.push(req.user.userId);
    }
    else {
        post.likes.splice(post.likes.indexOf(req.user.userId), 1);
    }
    await post.save();

    console.log(chalk.hex('#03befc').bold("~ Liked a post!"));
    res.redirect("/");
});

app.get('/edit/:id', isLoggedIn, async (req, res) => {
    const post = await PostModel.findOne({ _id: req.params.id });  // This is how we populate a referenced field

    res.render("edit.ejs", { post });
});

app.post('/update/:id', isLoggedIn, async (req, res) => {
    const { title, content } = req.body;
    const post = await PostModel.findOneAndUpdate({ _id: req.params.id }, { title, content });  // This is how we populate a referenced field

    res.redirect("/profile");
});

app.get('/delete/:id', isLoggedIn, async (req, res) => {
    const post = await PostModel.findOneAndDelete({ _id: req.params.id });
    console.log(post);

    res.redirect("/profile");
});

function isLoggedIn(req, res, next) {
    if (req.cookies.token === '') {
        console.log(chalk.hex('#03befc').bold("~ User is not logged in!"));
        res.render("loginRequired.ejs");
    }
    else {
        const data = jwt.verify(req.cookies.token, 'MonkeysCanBreathe');
        req.user = data;
        console.log(chalk.hex('#03befc').bold("~ User is already logged in!"));
        next();
    }
}

app.listen(8080, () => {
    console.log(chalk.hex('#ffd000').underline.bold("--- SERVER RUNNING AT PORT 8080 ---"));
});