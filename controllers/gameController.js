const jwt = require('jsonwebtoken');
const User = require("../models/user");
const bcrypt = require('bcrypt');

module.exports.renderGame = async(req,res) => {
    try{
        const user = req.user;
        res.render("chessboard.ejs",{user});
    }
    catch(e){
        console.log(e.message);
        req.flash("error","Some error Occured!");
    }
}

module.exports.renderSignupForm = (req,res)=>{
    res.render("signup.ejs");
}

module.exports.handleSignup = async(req,res)=>{
    try{
        const {username,email,password} = req.body;
        if(!username || !email || !password){
            req.flash('error','Enter valid credentials');
            return res.redirect('/signup');
        }

        //existing user
        const existingEmail = await User.findOne({email});
        const existingUsername = await User.findOne({username});
        if(existingEmail){
            req.flash("error","User already exists !");
            return res.redirect('/signup')
        }
        if(existingUsername){
            req.flash('error','Username already taken !');
            return res.redirect('/signup')
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({username,email,password:hashedPassword});
        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000
        });

        req.user = newUser;
        req.flash("success","Welcome to ChessMaster!");
        res.redirect("/");

    }
    catch(e){
        console.log("error signing up user",e.message);
        res.redirect("/signup");
    }
}

module.exports.renderLoginForm = (req,res)=>{
    res.render("login.ejs");
}

module.exports.handleLogin = async(req,res)=>{
    try{
        const {email,password} = req.body;
            
        const user = await User.findOne({email});
        if(!user){
            req.flash("error","User not registered");
            return res.redirect('/signup');
        }
    
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash("error","Invalid email or password!");
            return res.redirect("/login");
        }
    
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour
        });
    
        req.flash("success","Welcome Back Master!");
        req.user = user;
        res.redirect("/");
    }
    catch(e){
        console.log(e.message);
        req.flash("error",e.message);
        return res.redirect('/login')
    }
}

module.exports.handleLogout = (req,res)=>{
    res.clearCookie('token');
    req.flash('success', 'Logged out successfully.');
    res.redirect('/login');
}