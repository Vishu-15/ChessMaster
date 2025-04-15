const User = require("../models/user");


module.exports.renderUsers = async (req, res) => {
    try {
      const { username } = req.query;
  
      let users;
      if (username) {
        users = await User.find({
          username: { $regex: username, $options: "i" }, // case-insensitive search
        });
      } else {
        users = await User.find({});
      }
  
      res.render("allUsers", { users, searchQuery: username || "" });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/");
    }
}

module.exports.renderUserDetails = async(req,res)=>{
    try {
        const {id} = req.params;
        const user = await User.findById(id).populate({
            path: 'games',
            options: { sort: { date: -1 } },
            populate: [
              { path: 'player1', model: 'User' },
              { path: 'player2', model: 'User' }
            ]
        });

        const games = user.games.map((game) => {
            const isPlayer1 = game.player1._id.toString() === user._id.toString();
            const opponentUsername = isPlayer1 ? game.player2.username : game.player1.username;
        
            const result = game.winner === null
                ? "Draw"
                : game.winner._id.toString() === user._id.toString()
                ? "Won"
                : "Lost";
        
            return {
                opponentUsername,
                result,
                date: game.date
            };
        });
        
        console.log(games);
  
      res.render("profile.ejs", { user, games });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/users");
    }
}