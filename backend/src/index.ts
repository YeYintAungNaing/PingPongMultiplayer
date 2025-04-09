import express from "express"
import http from "http"
import { Server } from "socket.io"



interface StateValue {
    x: number; y: number; 
    speedX: number; speedY: number, 
    lastMouseX : number , lastMouseY : number, 
    lastTimeStamp : number, radius : number, score :  number
}

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
const maxBallSpeed: number = 20;

const gameStates: Record<string, { [keyValue: string]: StateValue }> = {};
// const re = { "lobby123" : {
//     'playerOneName' : { x: 150, y: 275, speedX: 0, speedY: 0, lastMouseX : 0, lastMouseY : 0, lastTimeStamp : performance.now(), radius: 40},
//     'playerTwoName' : { x: 950, y: 270, speedX: 0, speedY: 0, lastMouseX : 0, lastMouseY : 0, lastTimeStamp : performance.now(), radius: 40},
//     ball : { x: 550, y: 275, radius: 20, speedX: 0, speedY: 0, lastMouseX : 0, lastMouseY : 0, lastTimeStamp : 0 } 
// }}

//gameScores = {"123dh" : [0,0]}
const gameCanvas = {width: 1100, height : 550}
const goalHeight: number = 80;  
const goalYStart: number = (550 - 80) / 2; 
const goalYEnd: number = (550 + 80) / 2;  


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
        // gameStates[lobbyId] = {
        //     playerName: { x: 100, y: 200, speedX: 5, speedY: 3 }
        // } 
        gameStates[lobbyId] ||= {};
        gameStates[lobbyId][playerName] = { x: 150, y: 275, speedX: 0, speedY: 0, lastMouseX : 0, lastMouseY : 0, lastTimeStamp : performance.now(), radius: 40, score : 0};
        
        io.emit("updateLobbies", lobbies); // have to use io becuase must be sent to every connected user inside the global io, not just spefic socket
        callback(lobbyId); 
    });


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
        gameStates[lobbyId] ||= {};
        gameStates[lobbyId][playerName] = { x: 950, y: 270, speedX: 0, speedY: 0, lastMouseX : 0, lastMouseY : 0, lastTimeStamp : performance.now(), radius: 40. , score : 0};
        gameStates[lobbyId].ball = { x: 550, y: 275, radius: 20, speedX: 0, speedY: 0, lastMouseX : 0, lastMouseY : 0, lastTimeStamp : 0. , score : 0 };
        if (lobby.players.length === 2) {
           
            console.log(gameStates)

            
            io.to(lobbyId).emit("gameReady");
        }
      
        return callback({ success: true });
    });

    socket.on("startGame", (lobbyId) => {
        if (lobbies[lobbyId].gameStarted) return
        lobbies[lobbyId].gameStarted = true
        console.log('yep')
        setInterval(()=> {
            const currentGameState = gameStates[lobbyId];
            updateBall(currentGameState)
            
            io.to(lobbyId).emit("gameStateUpdated", currentGameState)
        }, 1000/60) 
    } )

      

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
        const currentGameState = gameStates[lobbyId];
        if (currentGameState) {
            return callback({success : true, currentGameState})
        }
        else {
            return callback({success : false})
        }
        
    })

    socket.on("playerMove", ({ x, y, radius, lobbyId, currentPlayer, mouseX, mouseY }) => {
        let currentGameState = gameStates[lobbyId];
        const now = performance.now();
        const deltaTime = (now - currentGameState[currentPlayer].lastTimeStamp) / 1000; 

        let speedX = currentGameState[currentPlayer].speedX
        let speedY = currentGameState[currentPlayer].speedY
    
        if (deltaTime > 0) { 
            speedX = (mouseX - currentGameState[currentPlayer].lastMouseX) / deltaTime;
            speedY = (mouseY - currentGameState[currentPlayer].lastMouseY) / deltaTime;
        }
        
        currentGameState[currentPlayer] = {
            ...currentGameState[currentPlayer],
            x, y, speedX, speedY, radius, lastMouseX : mouseX, 
            lastMouseY : mouseY, lastTimeStamp : now  
        }

        //io.to(lobbyId).emit("gameStateUpdated", currentGameState)
    });
    
    socket.on("getScore", (lobbyId, callback) => {
        if (!lobbies[lobbyId].gameStarted) return
        const currentGameState = gameStates[lobbyId]
        const [p1, p2] = Object.keys(currentGameState)
        const scores : number[] = [currentGameState[p1].score, currentGameState[p2].score ]
        callback(scores)

    })

    function updateBall(currentGameState : { [keyValue: string]: StateValue }) {
        const [p1, p2] = Object.keys(currentGameState)
        const player = currentGameState[p1]
        const player2 = currentGameState[p2]
        const predictedX = currentGameState.ball.x + currentGameState.ball.speedX;
        const predictedY = currentGameState.ball.y + currentGameState.ball.speedY;
    
        if (isGoal(predictedX, predictedY, currentGameState.ball)) {
            console.log('ddd')
            handleGoal(predictedX < gameCanvas.width / 2 ? "right" : "left", currentGameState);
            return; // Stop further processing for frame
        }
    
        // Check wall collisions
        if (predictedX - currentGameState.ball.radius <= 0 || predictedX + currentGameState.ball.radius >= gameCanvas.width) {
            currentGameState.ball.speedX *= -1; // Reverse X velocity upon wall collision
        }
        if (predictedY - currentGameState.ball.radius <= 0 || predictedY + currentGameState.ball.radius >= gameCanvas.height) {
            currentGameState.ball.speedY *= -1; // Reverse Y velocity upon wall collision
        }
    
        
        if (isColliding(player, currentGameState,  predictedX, predictedY)) {
            handleCollision(player, currentGameState);
        }
    
    
        if (isColliding(player2, currentGameState, predictedX, predictedY)) {
            handleCollision(player2, currentGameState);
        }
    
        //console.log("ball",currentGameState.ball.speedX, currentGameState.ball.speedY)
        currentGameState.ball.x += currentGameState.ball.speedX;
        currentGameState.ball.y += currentGameState.ball.speedY;
        keepBallInsideCanvas(currentGameState);
      }
    
    function handleCollision(player: StateValue, currentGameState : { [keyValue: string]: StateValue }) {
          const dx = currentGameState.ball.x - player.x;
          const dy = currentGameState.ball.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalX = dx / distance;
          const normalY = dy / distance;
    
          const dotProduct = currentGameState.ball.speedX * normalX + currentGameState.ball.speedY * normalY;
          currentGameState.ball.speedX -= 2 * dotProduct * normalX;
          currentGameState.ball.speedY -= 2 * dotProduct * normalY;
    
          // Threshold to ignore jittery mouse movements
          const minMovementThreshold = 1.5;  
    
          const effectivePlayerSpeedX = Math.abs(player.speedX) > minMovementThreshold ? player.speedX : 0;
          const effectivePlayerSpeedY = Math.abs(player.speedY) > minMovementThreshold ? player.speedY: 0;
    
          const speedFactor = 0.02;
          currentGameState.ball.speedX += effectivePlayerSpeedX * speedFactor;
          currentGameState.ball.speedY += effectivePlayerSpeedY * speedFactor;
    
          // Ensure minimum speed
          
          const speed = Math.sqrt(currentGameState.ball.speedX ** 2 + currentGameState.ball.speedY ** 2);
        //   console.log("player", player.speedX, player.speedY)
        //   console.log(speed)
          const minSpeed = 2; 
          if (speed < minSpeed) {
              const scale = minSpeed / speed;
              currentGameState.ball.speedX *= scale;
              currentGameState.ball.speedY *= scale;
          }
    
          // Ensure max speed
          if (speed > maxBallSpeed) {
              const scale = maxBallSpeed / speed;
              currentGameState.ball.speedX *= scale;
              currentGameState.ball.speedY *= scale;
          }
    
          const overlap = (currentGameState.ball.radius + player.radius) - distance;
          if (overlap > 0) {
              currentGameState.ball.x += overlap * normalX;
              currentGameState.ball.y += overlap * normalY;
          }
      }
    
      
     function isColliding(player: { x: number; y: number; radius: number }, currentGameState : { [keyValue: string]: StateValue }, predictedX: number, predictedY: number): boolean {
        const dx = predictedX - player.x;
        const dy = predictedY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= player.radius + currentGameState.ball.radius;
      }
    
     function keepBallInsideCanvas(currentGameState : { [keyValue: string]: StateValue }) {
        const padding = 1; // A small margin to prevent boundary glitches
      
        if (currentGameState.ball.x - currentGameState.ball.radius < 0) {
          currentGameState.ball.x = currentGameState.ball.radius + padding;
          currentGameState.ball.speedX = Math.abs(currentGameState.ball.speedX);
        } 
        if (currentGameState.ball.x + currentGameState.ball.radius > gameCanvas.width) {
          currentGameState.ball.x = gameCanvas.width - currentGameState.ball.radius - padding;
          currentGameState.ball.speedX = -Math.abs(currentGameState.ball.speedX);
        }
        if (currentGameState.ball.y - currentGameState.ball.radius < 0) {
          currentGameState.ball.y = currentGameState.ball.radius + padding;
          currentGameState.ball.speedY = Math.abs(currentGameState.ball.speedY);
        }
        if (currentGameState.ball.y + currentGameState.ball.radius > gameCanvas.height) {
          currentGameState.ball.y = gameCanvas.height - currentGameState.ball.radius - padding;
          currentGameState.ball.speedY = -Math.abs(currentGameState.ball.speedY);
        }
    }
    
    
    function isGoal(x: number, y: number, ball : StateValue): boolean {
        const isLeftGoal = x - ball.radius <= 0;
        const isRightGoal = x + ball.radius >= gameCanvas.width;
        const inGoalYRange = y >= goalYStart && y <= goalYEnd;
    
        return (isLeftGoal || isRightGoal) && inGoalYRange;
    }
    
    function handleGoal(scoringSide: "left" | "right", currentGameState : { [keyValue: string]: StateValue } ) {
        //console.log(`Goal for ${scoringSide} player!`);
        const [p1, p2] = Object.keys(currentGameState )
        const player = currentGameState[p1]
        const player2 = currentGameState[p2]
        if (scoringSide === "left") {
            player.score += 1
        }
        else {
            player2.score += 1
        }
        io.emit("getScoreLive")
        resetBall(scoringSide, currentGameState);
    }
    
    function resetBall(scoringSide :"left" | "right", currentGameState : { [keyValue: string]: StateValue } ) {
        
        if (scoringSide === "right") {
            currentGameState.ball = {
                x: 400, y: 225+40, radius: 20, speedX: 0, speedY: 0, 
                lastMouseX : 0, lastMouseY : 0, lastTimeStamp : 0 , score : 0
            }
        }
        else {
            currentGameState.ball = {
                x: 700, y: 225+40, radius: 20, speedX: 0, speedY: 0, 
                lastMouseX : 0, lastMouseY : 0, lastTimeStamp : 0 , score : 0
            }
        }
    }

});




server.listen(7000, () => {
    console.log("Listening on port 7000")
})

