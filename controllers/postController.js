const User = require("../models/user");
const Post = require('../models/post');


module.exports.renderAllPosts = async (req, res) => {
    try{
        const posts = await Post.find({}).populate("user");
        const currentUser = await User.findById(req.user._id);
        res.render('posts', { posts, currentUser });
    }
    catch(e){
        req.flash("error","Error Loading Posts!");
    }
}

module.exports.renderCreatePostForm = (req,res)=>{
    try{
        res.render("createPost.ejs");
    }
    catch(e){
        req.flash("error",e.message);
        res.redirect("/posts");
    }
}

module.exports.addNewPost = async(req,res)=>{
    try{
        let url = req.file.path;
        let filename = req.file.filename;
        let content = req.body.content;
    
        const newPost = new Post({
            content,
            user:req.user._id,
        });
        newPost.image={url,filename};
        await newPost.save();
    
        const user = await User.findById(req.user._id);
        user.posts.push(newPost);
        await user.save();
    
        req.flash("success","Post created successfully");
        return res.redirect('/posts');
    }
    catch(e){
        req.flash("error",e.message);
    }
}

module.exports.renderEditPostForm = async(req, res) => {
    try{
        const postId = req.params.id;
        const post = await Post.findById(postId);
        res.render('editPost', { post });
    }
    catch(e){
        req.flash("error",e.message);
        return res.redirect("/posts");
    }
}

module.exports.editPost = async(req,res)=>{
    try{
        const {id} = req.params;
        const content = req.body.content;
        const updatedPost = await Post.findByIdAndUpdate(id,{content},{ new: true, runValidators: true });

        if(typeof(req.file) !== 'undefined'){
            let url = req.file.path;
            let filename = req.file.filename;
            updatedPost.image={url,filename};
        }
        
        await updatedPost.save();
        req.flash("success","Post updated successfully");
        return res.redirect('/posts');
    }
    catch(e){
        req.flash("error",e.message);
    }
}

module.exports.deletePost = async(req,res)=>{
    try{
        const {id} = req.params;
        const deletedPost = await Post.findByIdAndDelete(id);
        console.log(deletedPost);
        req.flash("success","Post deleted successfully!");
        res.redirect("/posts");
    }
    catch(e){
        req.flash("error",e.message);
    }
}

