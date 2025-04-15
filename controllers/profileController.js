const User = require("../models/user");

module.exports.renderProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
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
      res.redirect("/");
    }
}

module.exports.renderEditProfileForm = async(req,res)=>{
    try{
        const {id} = req.params;
        const user = await User.findById(id);
    
        res.render("editProfile.ejs",{user});
    }
    catch(e){
        console.log(e.message);
        req.flash("error",e.messsage);
        res.redirect("/profile");
    }
}

module.exports.editProfile = async(req,res)=>{
    try{
        let {username,email,bio} = req.body;
        const {id} = req.params;
        const updatedProfile = await User.findByIdAndUpdate(id,{username,email,bio});

        if(typeof(req.file) !== 'undefined'){
            let url = req.file.path;
            let filename = req.file.filename;
            updatedProfile.profilePicture={url,filename};
        }

        await updatedProfile.save();
        req.flash("success","Profile Updated Successfully!");
        res.redirect("/profile");
    }
    catch(e){
        req.flash("error",e.message);
        res.redirect("/profile");
    }
}