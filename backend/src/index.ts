import express from "express"
import http from "http"
import { Server } from "socket.io"

const app = express()
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin:["http://localhost:5173", "http://localhost:5174"] }, 
});

app.get('/', (req, res) => {
    res.send({test : "test"})
})

const lobbies: Record<string, { players: string[] ; gameStarted : boolean }> = {};

const playerPositions: Record<string, { [playerName: string]: { x: number; y: number; speedX: number; speedY: number } }> = {};

// playerPositions =  {"room123": {
//     "player1": { x: 100, y: 200, speedX: 5, speedY: 3 },
//     "player2": { x: 300, y: 200, speedX: -5, speedY: -3 }
// },}

const gameState: Record<string, { 
    ball: { x: number; y: number; velocityX: number; velocityY: number }; 
    scores: { [playerId: string]: number }; 
    gameOver: boolean }> = {};

io.on("connection", (socket) => {
    console.log(`player connected with socket id : ${socket.id}`)

    socket.on("disconnect", () => {
        console.log('disconnected')
    })

    // exmaple lobies = {"2fgr4": { players: ["player1", "player2"] }}

    socket.on("createLobby", ({ playerName}, callback) => {
        const lobbyId = Math.random().toString(36).substring(2, 8); 
        //console.log(typeof lobbyId)
        lobbies[lobbyId] = { players: [playerName], gameStarted : false };
        socket.join(lobbyId); 
        // playerPositions[lobbyId] = {
        //     playerName: { x: 100, y: 200, speedX: 5, speedY: 3 }
        // } 
        playerPositions[lobbyId] ||= {};
        playerPositions[lobbyId][playerName] = { x: 100, y: 200, speedX: 5, speedY: 3 };
        io.emit("updateLobbies", lobbies); // have to use io becuase this must be sent to every connected user inside the global io, not just spefic socket
        callback(lobbyId); 
    });

    // socket.on("joinLobby", ({ lobbyId, playerName }) => {
    //     if (lobbies[lobbyId] && lobbies[lobbyId].players.length < 2) {
    //       lobbies[lobbyId].players.push(playerName);
    //       socket.join(lobbyId);

    //       //io.to(lobbyId).emit("lobbyUpdated", lobbies[lobbyId]); // io.to (only sent the info to specific room id)
    //       io.emit("updateLobbies", lobbies); 
    //       if (lobbies[lobbyId].players.length === 2) {
    //         lobbies[lobbyId].gameStarted = true

    //         io.to(lobbyId).emit("gameReady")
    //       }
    //     }
    // });

    socket.on("joinLobby", ({ lobbyId, playerName }, callback) => {
        const lobby = lobbies[lobbyId];
      
        if (!lobby) {
          return callback({ success: false, message: "Lobby not found" });
        }
      
        if (lobby.players.length >= 2) {
          return callback({ success: false, message: "Lobby is full" });
        }
      
        lobby.players.push(playerName);
        socket.join(lobbyId);
      
        io.emit("updateLobbies", lobbies);
        playerPositions[lobbyId] ||= {};
        playerPositions[lobbyId][playerName] = { x: 950, y: 270, speedX: 5, speedY: 3 };
      
        if (lobby.players.length === 2) {
            lobby.gameStarted = true;
           
            console.log(playerPositions)
            
            io.to(lobbyId).emit("gameReady");
        }
      
        return callback({ success: true });
    });
      

    socket.on("rejoinLobby", ({lobbyId, playerName}) => {
        if (!lobbies[lobbyId]) {
            console.log('lobby does not exist')
            return
        }
        else {
            socket.join(lobbyId)
            console.log(`${playerName} rejoin the lobby`)
            io.emit("updateLobbies", lobbies); 
        }
    })

    socket.on("getLobbies", (callback) => {  // all avaialble lobbies to show in lobby page
        // const lobbyId = crypto.randomUUID(); 
        // lobbies[lobbyId] = { players: [playerId] };
        // socket.join(lobbyId); 
        callback(lobbies); 
    });

    socket.on("getLobbyInfo", ({lobbyId}, callback) => {  //specific lobby
        callback(lobbies[lobbyId])
    })

    socket.on("getGameState", (lobbyId, callback) => {
        const currentGameState = playerPositions[lobbyId];
        if (currentGameState) {
            return callback({success : true, currentGameState})
        }
        else {
            return callback({success : false})
        }
        
    })

    socket.on("playerMove", ({ x, y, lobbyId, currentPlayer }) => {
        const currentGameState = playerPositions[lobbyId];
        currentGameState[currentPlayer] = {x, y, speedX: 5, speedY: 3 }

        io.to(lobbyId).emit("gameStateUpdated", currentGameState)
        
    }); 
});

server.listen(7000, () => {
    console.log("Listening on port 7000")
})

