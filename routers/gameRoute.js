const express = require('express');
const router = express.Router({mergeParams:true});

const gameController = require('../controllers/gameController');
const { isAuthenticated } = require('../middleware');

router.get("/",isAuthenticated,gameController.renderGame);

router
.route('/signup')
.get(gameController.renderSignupForm)
.post(gameController.handleSignup)

router
.route('/login')
.get(gameController.renderLoginForm)
.post(gameController.handleLogin)

router.get('/logout',isAuthenticated,gameController.handleLogout)

module.exports = router;