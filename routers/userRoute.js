const express = require('express');
const router = express.Router({mergeParams:true});

const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware');

router.get('/', isAuthenticated, userController.renderUsers);

router.get('/:id', isAuthenticated, userController.renderUserDetails);

module.exports = router;