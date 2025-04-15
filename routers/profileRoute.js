const express = require('express');
const router = express.Router({mergeParams:true});

const profileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middleware');

const multer = require("multer");
const { profileStorage } = require('../cloudConfig'); // path as needed
const uploadProfileImage = multer({ storage: profileStorage });

router.get('/', isAuthenticated, profileController.renderProfile)

router.get('/edit', isAuthenticated, profileController.renderEditProfileForm)

router.put(
    '/:id/edit',
    isAuthenticated, 
    uploadProfileImage.single('profilePicture'),
    profileController.editProfile,
)

module.exports = router;