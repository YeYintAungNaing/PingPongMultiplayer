import  {MySocket}  from "../socket/socketType";

interface Player{ x: number; y: number; radius : number ; playerName : string, speedX : number, speedY : number }

class Onlinegame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    player: Player
    player2: Player
    draggingPlayer: string |  null = null;
    ball: { x: number; y: number; radius: number; velocityX: number; velocityY: number };
    maxBallSpeed: number = 6.5;
    updateScore: (scoringSide: string) => void;
    socket : MySocket
    lobbyId : string
    currentPlayer : string
    
    goalHeight: number = 80;  
    goalYStart: number = (550 - 80) / 2; 
    goalYEnd: number = (550 + 80) / 2;  

    // to calculate cursor speed(player speed)
    playerSpeedX: number = 0;
    playerSpeedY: number = 0;
    lastMouseX: number = 0;
    lastMouseY: number = 0;
    lastTimestamp: number = performance.now();
  
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, playerOnePosition : Player, playerTwoPosition : Player,  updateScore: (scoringSide : string) => void, socket :  MySocket, lobbyId : string, currentPlayer : string) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.player =  playerOnePosition
      this.player2 = playerTwoPosition
      this.ball = { 
        x: 550, 
        y: 275, // mid point of canvas + diameter
        radius: 20, 
        velocityX: 0, 
        velocityY: 0 
      };
      this.updateScore = updateScore
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
      console.log(currentGameState)
    
      if (currentGameState[this.player.playerName]) {
        this.player.x = currentGameState[this.player.playerName].x;
        this.player.y = currentGameState[this.player.playerName].y;
        console.log(this.player.x, this.player.y)
      }
    
      if (currentGameState[this.player2.playerName]) {
        this.player2.x = currentGameState[this.player2.playerName].x;
        this.player2.y = currentGameState[this.player2.playerName].y;
        console.log(this.player2.x, this.player2.y)
      }
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

    // onMouseUp = (event: MouseEvent) => {
    //   if (this.draggingPlayer) {
    //     this.draggingPlayer = null;
    //     return;
    //   }
    
    //   const { offsetX, offsetY } = event;
    //   const clickedPlayer = this.isInsideCircle(offsetX, offsetY);
    //   console.log(clickedPlayer)
    
    //   if (!clickedPlayer) {
    //     this.draggingPlayer = null
    //     console.log('no')
    //     return
    //   }
    
    //   // ownership check
    //   const isOwner = (clickedPlayer === "player" && this.currentPlayer === this.player.playerName) ||
    //                   (clickedPlayer === "player2" && this.currentPlayer === this.player2.playerName);
    
    //   if (isOwner) {
    //     this.draggingPlayer = clickedPlayer; // directly assign "player" or "player2"
    //   }
    // };

    onMouseUp = (event: MouseEvent) => {
      if (this.draggingPlayer) {
        this.draggingPlayer = null;
        return;
      }
    
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
        const newX = event.offsetX;
        const newY = event.offsetY;
        console.log('dragging')

        // if (newX + this.player.radius >= this.canvas.width / 2) {
        //   //console.log('passed')
        //   this.playerSpeedX = 0
        //   return
        // }
        
        const now = performance.now();
        const deltaTime = (now - this.lastTimestamp) / 1000; 
        
        if (deltaTime > 0) { 
          
          this.playerSpeedX = (newX - this.lastMouseX) / deltaTime;
          this.playerSpeedY = (newY - this.lastMouseY) / deltaTime;
        }
    
        // this.player.x = Math.max(this.player.radius, Math.min(newX, this.canvas.width - this.player.radius));
        // this.player.y = Math.max(this.player.radius, Math.min(newY, this.canvas.height - this.player.radius));

        let x_;
        let y_;
        if (this.draggingPlayer === 'player') {
          x_ = Math.max(this.player.radius, Math.min(newX, this.canvas.width / 2 - this.player.radius));
          y_ = Math.max(this.player.radius, Math.min(newY, this.canvas.height - this.player.radius));
        } 
        else if (this.draggingPlayer === 'player2') {
          x_ = Math.max(this.canvas.width / 2 + this.player2.radius, Math.min(newX, this.canvas.width - this.player2.radius));
          y_ = Math.max(this.player2.radius, Math.min(newY, this.canvas.height - this.player2.radius));
        }
        
        
        this.socket.emit("playerMove", {
          x: x_,
          y: y_,
          currentPlayer : this.currentPlayer,
          lobbyId : this.lobbyId
        })
    
        this.lastMouseX = newX;
        this.lastMouseY = newY;
        this.lastTimestamp = now;
      }
    };


    updateBall() {
      const predictedX = this.ball.x + this.ball.velocityX;
      const predictedY = this.ball.y + this.ball.velocityY;
  
      if (this.isGoal(predictedX, predictedY)) {
          this.handleGoal(predictedX < this.canvas.width / 2 ? "right" : "left");
          return; // Stop further processing for this frame
      }
  
      // Check wall collisions
      if (predictedX - this.ball.radius <= 0 || predictedX + this.ball.radius >= this.canvas.width) {
          this.ball.velocityX *= -1; // Reverse X velocity upon wall collision
      }
      if (predictedY - this.ball.radius <= 0 || predictedY + this.ball.radius >= this.canvas.height) {
          this.ball.velocityY *= -1; // Reverse Y velocity upon wall collision
      }
  
      
      if (this.isColliding(this.player, predictedX, predictedY)) {
          this.handleCollision(this.player);
      }
  

      if (this.isColliding(this.player2, predictedX, predictedY)) {
          this.handleCollision(this.player2);
      }
  
      this.ball.x += this.ball.velocityX;
      this.ball.y += this.ball.velocityY;
      this.keepBallInsideCanvas();
    }

    handleCollision(entity: { x: number; y: number; radius: number }) {
        const dx = this.ball.x - entity.x;
        const dy = this.ball.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalX = dx / distance;
        const normalY = dy / distance;

        const dotProduct = this.ball.velocityX * normalX + this.ball.velocityY * normalY;
        this.ball.velocityX -= 2 * dotProduct * normalX;
        this.ball.velocityY -= 2 * dotProduct * normalY;

        // Threshold to ignore jittery mouse movements
        const minMovementThreshold = 1.5;  

        const effectivePlayerSpeedX = Math.abs(this.playerSpeedX) > minMovementThreshold ? this.playerSpeedX : 0;
        const effectivePlayerSpeedY = Math.abs(this.playerSpeedY) > minMovementThreshold ? this.playerSpeedY : 0;

        const speedFactor = 0.007;
        this.ball.velocityX += effectivePlayerSpeedX * speedFactor;
        this.ball.velocityY += effectivePlayerSpeedY * speedFactor;

        // Ensure minimum speed
        const speed = Math.sqrt(this.ball.velocityX ** 2 + this.ball.velocityY ** 2);
        const minSpeed = 2; 
        if (speed < minSpeed) {
            const scale = minSpeed / speed;
            this.ball.velocityX *= scale;
            this.ball.velocityY *= scale;
        }

        // Ensure max speed
        if (speed > this.maxBallSpeed) {
            const scale = this.maxBallSpeed / speed;
            this.ball.velocityX *= scale;
            this.ball.velocityY *= scale;
        }

        const overlap = (this.ball.radius + entity.radius) - distance;
        if (overlap > 0) {
            this.ball.x += overlap * normalX;
            this.ball.y += overlap * normalY;
        }
    }
  
    
    isColliding(player: { x: number; y: number; radius: number }, predictedX: number, predictedY: number): boolean {
      const dx = predictedX - player.x;
      const dy = predictedY - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= player.radius + this.ball.radius;
    }

    keepBallInsideCanvas() {
      const padding = 1; // A small margin to prevent boundary glitches
    
      if (this.ball.x - this.ball.radius < 0) {
        this.ball.x = this.ball.radius + padding;
        this.ball.velocityX = Math.abs(this.ball.velocityX);
      } 
      if (this.ball.x + this.ball.radius > this.canvas.width) {
        this.ball.x = this.canvas.width - this.ball.radius - padding;
        this.ball.velocityX = -Math.abs(this.ball.velocityX);
      }
      if (this.ball.y - this.ball.radius < 0) {
        this.ball.y = this.ball.radius + padding;
        this.ball.velocityY = Math.abs(this.ball.velocityY);
      }
      if (this.ball.y + this.ball.radius > this.canvas.height) {
        this.ball.y = this.canvas.height - this.ball.radius - padding;
        this.ball.velocityY = -Math.abs(this.ball.velocityY);
      }
    }

    isGoal(x: number, y: number): boolean {
      const isLeftGoal = x - this.ball.radius <= 0;
      const isRightGoal = x + this.ball.radius >= this.canvas.width;
      const inGoalYRange = y >= this.goalYStart && y <= this.goalYEnd;
  
      return (isLeftGoal || isRightGoal) && inGoalYRange;
    }

    handleGoal(scoringSide: "left" | "right") {
      //console.log(`Goal for ${scoringSide} player!`);
      this.updateScore(scoringSide)
      this.resetBall(scoringSide);
    }

    resetBall(scoringSide :"left" | "right" ) {
      this.ball.velocityX =  0
      this.ball.velocityY =  0 
      if (scoringSide === "right") {
        this.ball.x = 400
        this.ball.y = 225 + 40
          
      }
      else {
        this.ball.x = 700
        this.ball.y = 225 + 40
      }
    }


     
    
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
  