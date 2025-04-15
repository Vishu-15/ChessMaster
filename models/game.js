const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
  player1: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  player2: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  result: {
    type: String,
    enum: ['draw', 'won', 'loss'],
    required: true
  },
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null // for draw, no winner
  },
  date: {
    type: Date,
    default: Date.now
  },
  pgn: {
    type: String, // Portable Game Notation (optional)
  },
  timeControl: {
    type: String, // e.g. '5+0', '3+2'
    default: 'unlimited'
  }
});

module.exports = mongoose.model('Game', gameSchema);
