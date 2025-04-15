if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}
const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const path = require("path");
const { Chess } = require("chess.js");
const cookieParser = require('cookie-parser');
const session = require("express-session");
const mongoose = require('mongoose');
const User = require("./models/user");
const Game = require('./models/game');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');
const { setUser } = require('./middleware');
const Post = require('./models/post');

const postRoute = require('./routers/postRoute');
const gameRoute = require('./routers/gameRoute');
const userRoute = require('./routers/userRoute');
const profileRoute = require('./routers/profileRoute');


const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine('ejs',ejsMate);
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));
app.use(methodOverride('_method'));

const store = MongoStore.create({
    mongoUrl: process.env.ATLAS_DB_URL || "mongodb://127.0.0.1:27017/chessApp",
    crypto:{
        secret:process.env.SESSION_SECRET,
    },
    touchAfter:24*3600,//session interval
});

store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE ",err);
})

const sessionOptions = {
    store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true if using HTTPS in prod
    }
}

app.use(session(sessionOptions));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
  });

app.use(setUser);

main()
.then(console.log("database initialized"))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.ATLAS_DB_URL);
}

app.use("/posts",postRoute);
app.use("/",gameRoute);
app.use("/users",userRoute);
app.use("/profile",profileRoute);


app.get("*",(req,res)=>{
    req.flash("error","Page Not Found");
    res.redirect("/");
});




let waitingPlayers = [];
const gameData = {}; // Store Chess instances for each room

io.on("connection", (socket) => {
    socket.on("play", (playername) => {
        socket.username = playername;
        socket.emit("boardState", 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    
        if (waitingPlayers.length === 0) {
            waitingPlayers.push(socket);
            socket.emit("waiting", "waiting for opponent");
        } else {
            const opponentSocket = waitingPlayers.shift();
            const room = `room-${opponentSocket.id}-${socket.id}`;
            socket.room = room;
            opponentSocket.room = room;
    
            socket.join(room);
            opponentSocket.join(room);
    
            gameData[room] = {
                chess: new Chess(),
                white: { id: opponentSocket.id, username: opponentSocket.username },
                black: { id: socket.id, username: socket.username },
            };
    
            opponentSocket.emit("player-role", "w");
            socket.emit("player-role", "b");
    
            io.to(room).emit("start-game", "paired, start the game", opponentSocket.username, socket.username);
        }
    })

    socket.on("move", async(move) => {
        try{
            if (!socket.room || !gameData[socket.room]) return;
    
            const { chess, white, black } = gameData[socket.room];
            if (chess.turn() === "w" && socket.id !== white.id) return;
            if (chess.turn() === "b" && socket.id !== black.id) return;
    
            const result = chess.move(move);
            if (result) {
                io.to(socket.room).emit("move", move);
                io.to(socket.room).emit("boardState", chess.fen());
                io.to(socket.room).emit("update-move",chess.history());

                
                if (chess.isGameOver()) {
                    
                    const blackPlayer = await User.findOne({username: gameData[socket.room].black.username});
                    const whitePlayer = await User.findOne({username: gameData[socket.room].white.username});

                    const newGame = new Game({
                        player1: blackPlayer,
                        player2: whitePlayer,
                        pgn: chess.pgn({ newline: '<br />' }),
                    })

                    if(chess.isCheckmate()){
                        if(chess.turn()=='b'){
                            whitePlayer.winCount+=1;
                            blackPlayer.lossCount+=1;
                            whitePlayer.rating+=8;
                            blackPlayer.rating-=8;

                            newGame.winner=whitePlayer;
                            io.to(socket.room).emit("gameover","checkmate - White won", chess.turn());
                        }
                        else if(chess.turn()=='w'){
                            whitePlayer.lossCount+=1;
                            blackPlayer.winCount+=1;
                            whitePlayer.rating-=8;
                            blackPlayer.rating+=8;
                            
                            newGame.winner=blackPlayer;
                            io.to(socket.room).emit("gameover","checkmate - Black won", chess.turn());
                        }
                        newGame.result="won";
                    }
                    else if(chess.isDraw() || chess.isStalemate()){
                        whitePlayer.drawCount+=1;
                        blackPlayer.drawCount+=1;
                        newGame.result="draw";
                        io.to(socket.room).emit("gameover","Draw", chess.turn());
                    }
                    await newGame.save();
                    blackPlayer.games.push(newGame);
                    whitePlayer.games.push(newGame);
                    await whitePlayer.save();
                    await blackPlayer.save();
                    console.log("gameover");
                    // chess.reset();

                    // Now clean up the game data
                    delete gameData[socket.room];
                    console.log(`Room ${socket.room} closed.`);
                }
            } 
            else {
                socket.emit("invalidMove", "This move is not valid.");
                return;
            }
        }
        catch(e){
            console.log(e.message);
        }
    });

    socket.on("message", (msg) => {
        if (!socket.room || !gameData[socket.room]) return;
        if (socket.id === gameData[socket.room].white.id) io.to(socket.room).emit("message",'w',msg);
        if (socket.id === gameData[socket.room].black.id) io.to(socket.room).emit("message",'b',msg);
    });

    socket.on("disconnect", async () => {
        waitingPlayers = waitingPlayers.filter(s => s.id !== socket.id);
    
        const room = socket.room;
        const game = gameData[room];
        if (!room || !game) {
            return;
        }
    
        // Emit disconnect message to the room
        io.to(room).emit("opponentDisconnected", "Your opponent has disconnected.");
    
        try {
            const { white, black, chess } = game;
    
            const blackPlayer = await User.findOne({ username: black.username });
            const whitePlayer = await User.findOne({ username: white.username });
    
            const newGame = new Game({
                player1: blackPlayer,
                player2: whitePlayer,
                result: "won",
                pgn: chess.pgn({ newline: '<br />' }),
            });
    
            if (socket.id === white.id) {
                blackPlayer.winCount += 1;
                whitePlayer.lossCount += 1;
                blackPlayer.rating += 8;
                whitePlayer.rating -= 8;
                newGame.winner = blackPlayer;
            } else if (socket.id === black.id) {
                whitePlayer.winCount += 1;
                blackPlayer.lossCount += 1;
                whitePlayer.rating += 8;
                blackPlayer.rating -= 8;
                newGame.winner = whitePlayer;
            }
    
            await newGame.save();
            blackPlayer.games.push(newGame);
            whitePlayer.games.push(newGame);
            await blackPlayer.save();
            await whitePlayer.save();
    
        } catch (err) {
            console.error("Error handling disconnect:", err.message);
        }
    
        // Now clean up the game data
        delete gameData[room];
        console.log(`Room ${room} closed.`);
    });  
    
    
    socket.on("likePost", async ({ postId, userId }) => {
        try {
            const post = await Post.findById(postId);
    
            const alreadyLiked = post.likes.includes(userId);
            if (alreadyLiked) {
                post.likes.pull(userId);
            } else {
                post.likes.push(userId);
            }
    
            await post.save();
    
            io.emit("postLiked", {
                postId,
                likesCount: post.likes.length,
                userId,
                liked: !alreadyLiked,
            });
        } catch (err) {
            console.log("Error liking post:", err);
            // socket.emit("errorLikingPost", { message: "Something went wrong." });
        }
    });


    socket.on("commentPost", async ({ postId, userId, comment }) => {
        try {
            const post = await Post.findById(postId);
            const user = await User.findById(userId);
    
            if (!post || !user) return;
    
            post.comments.unshift({
                username: user.username,
                text: comment,
            });
    
            await post.save();
    
            io.emit("commentedOnPost", {
                postId,
                username: user.username,
                comment,      
            });
        } catch (e) {
            console.log("Error commenting on post:", e.message);
        }
    });
    
});


server.listen(3000, () => {
    console.log("Server is listening at port 3000");
});
