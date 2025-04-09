import  {MySocket}  from "../socket/socketType";

interface Player{ 
            x: number; y: number; radius : number ; 
            playerName : string, speedX : number, speedY : number;
            lastTimeStamp : number ;  lastMouseX : number , lastMouseY : number;
            score : number
              }
interface Ball {
       x: number; y: number; radius: number; speedX: number; speedY: number 
       lastTimeStamp : number ;  lastMouseX : number , lastMouseY : number;
              }

class Onlinegame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;    
    player: Player
    player2: Player
    draggingPlayer: string |  null = null;
    ball: Ball 
    maxBallSpeed: number = 6.5;
    //updateScore: (scoringSide: string) => void;
    socket : MySocket
    lobbyId : string
    currentPlayer : string
    
    goalHeight: number = 80;  
    goalYStart: number = (550 - 80) / 2; 
    goalYEnd: number = (550 + 80) / 2;  

    // to calculate cursor speed(player speed)
    // playerSpeedX: number = 0;
    // playerSpeedY: number = 0;
    // lastMouseX: number = 0;
    // lastMouseY: number = 0;
    //lastTimestamp: number = performance.now();
  
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, playerOnePosition : Player, playerTwoPosition : Player, ballPosition : Ball, socket :  MySocket, lobbyId : string, currentPlayer : string) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.player =  playerOnePosition
      this.player2 = playerTwoPosition
      this.ball = ballPosition
      //this.updateScore = updateScore
      this.socket = socket
      this.lobbyId = lobbyId
      this.currentPlayer = currentPlayer

      this.initMouseEvents();
      this.socket.on("gameStateUpdated", this.handleGameStateUpdated);

    }

    // currentGameState = {
    //   "player1": { x: 100, y: 200, speedX: 5, speedY: 3 },
    //   "player2": { x: 300, y: 200, speedX: -5, speedY: -3 }
    // } 
    handleGameStateUpdated = (currentGameState) => {
     // console.log(currentGameState)
    
      if (currentGameState[this.player.playerName]) {
        this.player = {...this.player, ...currentGameState[this.player.playerName]} 
      }
    
      if (currentGameState[this.player2.playerName]) {
        this.player2 = {...this.player2, ...currentGameState[this.player2.playerName]}
      }
      this.ball = currentGameState.ball
      //console.log(this.player.speedX, this.player.speedY)
    }

    initMouseEvents() {
      this.canvas.addEventListener("mousemove", this.onMouseMove);
      this.canvas.addEventListener("mouseup", this.onMouseUp);
    }

    // isInsideCircle(offsetX: number, offsetY: number): "player" | "player2" | null {
    //   const check = (player : Player) => {
    //     const dx = offsetX - player.x;
    //     const dy = offsetY - player.y;
    //     return Math.sqrt(dx * dx + dy * dy) <= player.radius;
    //   }
    
    //   if (check(this.player)) return "player";
    //   if (check(this.player2)) return "player2";
      
    //   return null;
    // }

    isInsideCircle(offsetX: number, offsetY: number): "player" | "player2" | null {
      const players: Array<["player" | "player2", Player]> = [
        ["player", this.player],
        ["player2", this.player2],
      ];
    
      for (const [key, player] of players) {
        const dx = offsetX - player.x;
        const dy = offsetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance <= player.radius) {
          return key;
        }
      }
    
      return null;
    }

    onMouseUp = (event: MouseEvent) => {
      if (this.draggingPlayer) {
        this.draggingPlayer = null;
        return;
      }
      console.log(this.ball)
    
      const { offsetX, offsetY } = event;
      const clickedPlayer = this.isInsideCircle(offsetX, offsetY);
    
      if (!clickedPlayer) {
        this.draggingPlayer = null;
        console.log('No player clicked');
        return;
      }
    
      // get actual player object based on "player" or "player2"
      const clickedPlayerObj = this[clickedPlayer]; 
    
      if (clickedPlayerObj.playerName === this.currentPlayer) {
        this.draggingPlayer = clickedPlayer; // either "player" or "player2"
      }
    };
  
    onMouseMove = (event: MouseEvent) => {
      if (this.draggingPlayer) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;
        console.log('dragging')

        // if (mouseX + this.player.radius >= this.canvas.width / 2) {
        //   //console.log('passed')
        //   this.playerSpeedX = 0
        //   return
        // }
        

    
        // this.player.x = Math.max(this.player.radius, Math.min(mouseX, this.canvas.width - this.player.radius));
        // this.player.y = Math.max(this.player.radius, Math.min(mouseY, this.canvas.height - this.player.radius));

        let x_;
        let y_;
        if (this.draggingPlayer === 'player') {
          x_ = Math.max(this.player.radius, Math.min(mouseX, this.canvas.width / 2 - this.player.radius));
          y_ = Math.max(this.player.radius, Math.min(mouseY, this.canvas.height - this.player.radius));
        } 
        else if (this.draggingPlayer === 'player2') {
          x_ = Math.max(this.canvas.width / 2 + this.player2.radius, Math.min(mouseX, this.canvas.width - this.player2.radius));
          y_ = Math.max(this.player2.radius, Math.min(mouseY, this.canvas.height - this.player2.radius));
        }


        // const now = performance.now();
        // const deltaTime = (now - this.lastTimestamp) / 1000; 

        // let speedX = 0
        // let speedY = 0
        
        // // if (this.draggingPlayer === "player") {
        // //     speedX = this.player.speedX
        // //     speedY = this.player.speedY
        // // }
        // // else {
        // //     speedX = this.player2.speedX
        // //     speedY = this.player2.speedY
        // // }
        
        // if (deltaTime > 0) { 
        //     speedX = (mouseX - this.lastMouseX) / deltaTime;
        //     speedY = (mouseY - this.lastMouseY) / deltaTime;
        // }
        
        
        this.socket.emit("playerMove", {
          x: x_,
          y: y_,
          mouseX,
          mouseY,
          radius : 40,
          currentPlayer : this.currentPlayer,
          lobbyId : this.lobbyId,
        })
      }
    };

    
    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawStaticElement()
      
      //player and ai (color should be diff)
      this.ctx.beginPath();
      this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
      this.ctx.arc(this.player2.x, this.player2.y, this.player2.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "green";
      this.ctx.fill();

      // Vall
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "blue";
      this.ctx.fill();
    }

    drawStaticElement() {
      this.ctx.fillStyle = "green"; 
      const goalWidth = 2;
      
      this.ctx.fillRect(0, this.goalYStart, goalWidth, this.goalHeight);
      this.ctx.fillRect(this.canvas.width - goalWidth, this.goalYStart, goalWidth, this.goalHeight);
      //this.ctx.fillRect(this.canvas.width/2 - 1, this.canvas.height, 2, this.canvas.height);
      this.ctx.fillStyle = "rgb(3, 101, 72)"; 
      this.ctx.fillRect(this.canvas.width / 2 - 0.5, 0, 1, this.canvas.height);
    }
  }
  
  export default Onlinegame;
  