const socket = io();
const chess = new Chess();

let playerRole = "";
let draggedPiece=null;
let sourceSquare=null;

let renderBoard=()=>{
    const board = document.querySelector('.board');
    board.innerHTML="";
    const chessBoard = chess.board();
    console.log(chessBoard);

    chessBoard.forEach((row,rowIndex)=>{
        row.forEach((square,colIndex)=>{
            let squareElement = document.createElement("div");
            (rowIndex+colIndex)%2==0?squareElement.classList.add('square','light'):squareElement.classList.add('square','dark');
            squareElement.dataset.row=rowIndex;
            squareElement.dataset.col=colIndex;
            
            
            if(square){
                let pieceElement = document.createElement('div');
                pieceElement.classList.add('piece',square.color=='b'?"blackPiece":"whitePiece");
                if(playerRole == 'b'){
                    pieceElement.classList.add("flipped");
                }
                
                pieceElement.innerText = getUniqueCode(square);
                pieceElement.draggable = playerRole == square.color;

                pieceElement.addEventListener('dragstart',(event)=>{
                    // console.log("drag started");
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = { row : rowIndex , col : colIndex };
                        event.dataTransfer.setData("Text","");
                        event.target.style.opacity=0.2;
                    }
                })
            
                pieceElement.addEventListener('dragend', (event) => {
                    // console.log('Drag ended!');
                    draggedPiece=null;
                    sourceSquare=null;
                    event.target.style.opacity=1;
                });

                // pieceElement.addEventListener('drag', (event) => {
                //     console.log('Dragging...');
                // });
                
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (event) => {
                event.preventDefault(); // Necessary to allow dropping
            });

            squareElement.addEventListener('drop', (event) => {
                event.preventDefault();
                if(draggedPiece){
                    const targetSquare ={
                        row : parseInt(squareElement.dataset.row),
                        col : parseInt(squareElement.dataset.col),
                    }
                    console.log(targetSquare);
                    handleMove(sourceSquare,targetSquare);
                }
            });

            board.appendChild(squareElement);
            if(playerRole=="b"){
                board.classList.add("flipped");
            }
        })
    });
}

const updateMoveHistory = (history)=>{
    let moveHistory = document.querySelector('.move-history');
    moveHistory.innerHTML="";

    let moveCount = 1;
    for(let i=0;i<history.length;i+=2){
        let newMove = document.createElement("pre");
        if(i+1 < history.length){
            newMove.innerText=`${moveCount}.        ${history[i]}       ${history[i+1]}`;
            moveCount++;
        }
        else{
            newMove.innerText=`${moveCount}.        ${history[i]}`;
        }
        moveHistory.appendChild(newMove);
    }
    moveHistory.scrollTop = moveHistory.scrollHeight;
}

const handleMove = (source,target)=>{
    const move = {
        from : `${String.fromCharCode(97+source.col)}${8-source.row}`,
        to : `${String.fromCharCode(97+target.col)}${8-target.row}`,
        promotion : "q",
    }

    socket.emit("move",move);
}

const getUniqueCode=(piece)=>{
    const uniqueCode = {
        p : "♙",
        r : "♖",
        b : "♗",
        n : "♘",
        q : "♕",
        k : "♔",
        P : "♟",
        R : "♜",
        B : "♝",
        N : "♞",
        Q : "♛",
        K : "♚",
    }
    let type = piece.type.toUpperCase();
    return uniqueCode[type] || "";
}

socket.on("player-role",(role)=>{
    playerRole = role;
    renderBoard();
});

socket.on('spectator-role',()=>{
    playerRole = "";
    renderBoard();
})

socket.on('move',(move)=>{
    chess.move(move);
    renderBoard();
})

socket.on("boardState",(fen)=>{
    chess.load(fen);
    renderBoard();
})

socket.on("update-move",(history)=>{
    updateMoveHistory(history);
})

socket.on("gameover", (msg, winningSide) => {
    let winSide = winningSide == 'b' ? "white" : "black";
    const board = document.querySelector('.board');
    const result = document.createElement('div');
    result.innerHTML = msg;

    if (playerRole === 'b') {
        result.classList.add("result", "flipped", "show");
    } else {
        result.classList.add("result", "show");
    }
    board.appendChild(result);
    
    setTimeout(()=>{
        result.classList.add("inactive");
        document.querySelector('.play-btn').classList.remove('inactive');
        document.querySelector('.type-message').classList.add('inactive');
        // chess.reset();
    },5000);
});

socket.on("opponentDisconnected",(msg)=>{
    alert(msg);
    document.querySelector('.players').classList.add('inactive');
    document.querySelector('.play-btn').classList.remove('inactive');
    document.querySelector('.type-message').classList.add('inactive');
    document.querySelector('.players').classList.add('inactive');
    document.querySelector('.type-message').classList.add('inactive');
})

socket.on("waiting",(msg)=>{
    alert(msg);
})

socket.on("start-game",(msg,player1,player2)=>{
    renderBoard();
    alert(msg);
    document.querySelector(".messages").innerHTML='';
    document.querySelector('.move-history').innerHTML='';
    document.querySelector('#player1').innerText = player1;
    document.querySelector('#player2').innerText = player2;
    document.querySelector('.players').classList.remove('inactive');
    document.querySelector('.type-message').classList.remove('inactive');
    document.querySelector('.play-btn').classList.add('inactive');
})


renderBoard();


// handling messages
document.querySelector('.msg-btn').addEventListener('click',()=>{
    console.log("msg btn clicked");
    const msg = document.querySelector('.type-message input').value;

    socket.emit("message",msg);
    
    document.querySelector('.type-message input').value='';
    
})

socket.on("message",(role,msg)=>{
    const newMessage = document.createElement("div");
    newMessage.classList.add('new-message');
    if(role == playerRole){
        newMessage.classList.add("self");
        newMessage.innerText=`You : ${msg}`;
    }
    else{
        newMessage.innerText=`Opponent : ${msg}`;
    }
    
    const allMessages = document.querySelector(".messages");
    allMessages.appendChild(newMessage);
    allMessages.scrollTop = allMessages.scrollHeight;
});

const playername = document.querySelector('.user').dataset.username;
console.log(playername);
// start game 
document.querySelector(".play-btn").addEventListener('click',()=>{
    socket.emit("play",playername);
    document.querySelector(".messages").innerHTML='';
    document.querySelector('.move-history').innerHTML='';
})