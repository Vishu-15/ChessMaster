const express = require('express');
const router = express.Router({mergeParams:true});
const postController = require('../controllers/postController');
const { isAuthenticated } = require('../middleware');

const multer = require("multer");
const { postsStorage } = require('../cloudConfig');
const uploadPostImage = multer({ storage: postsStorage });

router
.route("/")
.get(
    isAuthenticated,
    postController.renderAllPosts
)
.post(
    isAuthenticated,
    uploadPostImage.single('image'),
    postController.addNewPost,
)

router
.route('/:id/edit')
.get(
    isAuthenticated,
    postController.renderEditPostForm,
)
.put(
    isAuthenticated,
    uploadPostImage.single('image'),
    postController.editPost,
)

router.delete("/:id/delete",postController.deletePost);

router.get("/new",postController.renderCreatePostForm);


module.exports = router;