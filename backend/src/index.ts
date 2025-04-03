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

const lobbies: Record<string, { players: string[] }> = {};

io.on("connection", (socket) => {
    console.log(`player connected with socket id : ${socket.id}`)

    socket.on("disconnect", () => {
        console.log('disconnected')
    })

    // exmaple lobies = {"lobby1": { players: ["player1", "player2"] }}

    socket.on("createLobby", ({ playerName}, callback) => {
        const lobbyId = crypto.randomUUID(); 
        lobbies[lobbyId] = { players: [playerName] };
        socket.join(lobbyId); 
        io.emit("updateLobbies", lobbies); // have to use io becuase this must be sent to every connected user inside the global io, not just spefic socket
        callback(`Lobby : ${lobbyId} has been created by ${playerName}`); 
    });

    socket.on("joinLobby", ({ lobbyId, playerName }) => {
        if (lobbies[lobbyId] && lobbies[lobbyId].players.length < 2) {
          lobbies[lobbyId].players.push(playerName);
          socket.join(lobbyId);
          //io.to(lobbyId).emit("lobbyUpdated", lobbies[lobbyId]); // Notify players in the lobby
          io.emit("updateLobbies", lobbies); 
        }
    });

    socket.on("getLobbies", (callback) => {
        // const lobbyId = crypto.randomUUID(); 
        // lobbies[lobbyId] = { players: [playerId] };
        // socket.join(lobbyId); 
        callback(lobbies); 
    });
});



server.listen(7000, () => {
    console.log("Listening on port 7000")
})

