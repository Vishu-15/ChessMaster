const jwt = require('jsonwebtoken');
const User = require("./models/user");

module.exports.setUser = async (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            req.user = user;
            res.locals.currUser = req.user;
        } catch (e) {
            console.log("JWT verification failed:", e.message);
            req.user = null;
        }
    }
    return next();
}

module.exports.isAuthenticated = async(req,res,next)=>{
    if(!req.user){
        return res.redirect("/login");
    }
    return next();
}