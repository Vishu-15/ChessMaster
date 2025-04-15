const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password:{
    type:String,
    required: true,
  },
  profilePicture: {
    filename: String,
    url: String,
  },
  rating: {
    type: Number,
    default: 200, // Starting ELO rating
  },
  winCount: {
    type: Number,
    default: 0,
  },
  lossCount: {
    type: Number,
    default: 0,
  },
  drawCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  games:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref:'Game',
    },
  ],
  posts:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref:'Post',
    }
  ],
  bio: {
    type: String,
    maxlength: 150,
    default:"Chess is Love",
  },
});


// userSchema.plugin(passportLocalMongoose, {
//   usernameField: 'email',
//   errorMessages: {
//     MissingPasswordError: 'Password is required',
//     MissingUsernameError: 'Email is required',
//     UserExistsError: 'A user with the given email already exists',
//   },
// });

module.exports = mongoose.model('User', userSchema);
