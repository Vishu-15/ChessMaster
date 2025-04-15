// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    content: { 
        type: String,
        required: true,    
    },
    image: { 
        filename: String,
        url: String,
    },
    likes: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
        }
    ],
    comments: [
        {
            username: String,
            text: String,
        }
    ],  
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
