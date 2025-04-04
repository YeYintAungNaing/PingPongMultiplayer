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
        io.emit("updateLobbies", lobbies); // have to use io becuase this must be sent to every connected user inside the global io, not just spefic socket
        callback(lobbyId); 
    });

    socket.on("joinLobby", ({ lobbyId, playerName }) => {
        if (lobbies[lobbyId] && lobbies[lobbyId].players.length < 2) {
          lobbies[lobbyId].players.push(playerName);
          socket.join(lobbyId);
          //io.to(lobbyId).emit("lobbyUpdated", lobbies[lobbyId]); // io.to (only sent the info to specific room id)
          io.emit("updateLobbies", lobbies); 
          if (lobbies[lobbyId].players.length === 2) {
            lobbies[lobbyId].gameStarted = true
            io.to(lobbyId).emit("gameReady")
          }
        }
    });

    socket.on("getLobbies", (callback) => {
        // const lobbyId = crypto.randomUUID(); 
        // lobbies[lobbyId] = { players: [playerId] };
        // socket.join(lobbyId); 
        callback(lobbies); 
    });

    socket.on("getLobbyInfo", ({lobbyId}, callback) => {
        callback(lobbies[lobbyId])
    })
});


server.listen(7000, () => {
    console.log("Listening on port 7000")
})

