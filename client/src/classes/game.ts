class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    player: { x: number; y: number; radius : number };
    isDragging: boolean = false;
    ball: { x: number; y: number; radius: number; velocityX: number; velocityY: number };
    maxBallSpeed: number = 6.5;

    // to calculate cursor speed(player speed)
    playerSpeedX: number = 0;
    playerSpeedY: number = 0;
    lastMouseX: number = 0;
    lastMouseY: number = 0;
    lastTimestamp: number = performance.now();
  
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.player = { x: 200, y: 200, radius : 30 };
      this.ball = { 
        x: 500, 
        y: 200, 
        radius: 20, 
        velocityX: 1.8, 
        velocityY: 1.8 
      };
  
      this.initMouseEvents();
    }
  
    initMouseEvents() {
      this.canvas.addEventListener("mousemove", this.onMouseMove);
      this.canvas.addEventListener("mouseup", this.onMouseUp);
    }

    isInsideCircle(offsetX: number, offsetY: number): boolean {
      const dx = offsetX - this.player.x;
      const dy = offsetY - this.player.y;
      return Math.sqrt(dx * dx + dy * dy) <= this.player.radius;
    }

    onMouseUp = (event : MouseEvent) => {
      //console.log('up')
      if (this.isDragging) {
        this.isDragging = false
        //console.log('cancel drag')
        return
      }

      const {offsetX, offsetY} = event;
      if (this.isInsideCircle(offsetX, offsetY)) {
        this.isDragging = true
        //console.log('touched')
      }
    };

  
    onMouseMove = (event: MouseEvent) => {
      if (this.isDragging) {
        const newX = event.offsetX;
        const newY = event.offsetY;
        
        
        const now = performance.now();
        const deltaTime = (now - this.lastTimestamp) / 1000; 
        
        if (deltaTime > 0) { 
          this.playerSpeedX = (newX - this.lastMouseX) / deltaTime;
          this.playerSpeedY = (newY - this.lastMouseY) / deltaTime;
        }
    
        this.player.x = Math.max(this.player.radius, Math.min(newX, this.canvas.width - this.player.radius));
        this.player.y = Math.max(this.player.radius, Math.min(newY, this.canvas.height - this.player.radius));
    
        this.lastMouseX = newX;
        this.lastMouseY = newY;
        this.lastTimestamp = now;
      }
    };
  
    updateBall() {
      const predictedX = this.ball.x + this.ball.velocityX;
      const predictedY = this.ball.y + this.ball.velocityY;
    
      // check wall
      if (predictedX - this.ball.radius <= 0 || predictedX + this.ball.radius >= this.canvas.width) {
        this.ball.velocityX *= -1; // Reverse X velocity upon wall collision
      }
      if (predictedY - this.ball.radius <= 0 || predictedY + this.ball.radius >= this.canvas.height) {
        this.ball.velocityY *= -1; // Reverse Y velocity upon wall collision
      }
    
      if (this.isColliding(this.player, predictedX, predictedY)) {
        
        const dx = this.ball.x - this.player.x;
        const dy = this.ball.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalX = dx / distance;
        const normalY = dy / distance;
      
       
        const dotProduct = this.ball.velocityX * normalX + this.ball.velocityY * normalY;
        this.ball.velocityX -= 2 * dotProduct * normalX;
        this.ball.velocityY -= 2 * dotProduct * normalY;
      
        const playerSpeed = Math.sqrt(this.playerSpeedX ** 2 + this.playerSpeedY ** 2);
        //console.log(this.playerSpeedX, this.playerSpeedY)
        const speedFactor = 0.001; // Adjust how much player speed affects the ball
        console.log("player:" ,this.playerSpeedX, this.playerSpeedY, playerSpeed)
        this.ball.velocityX += this.playerSpeedX * speedFactor;
        this.ball.velocityY += this.playerSpeedY * speedFactor;
        console.log("ball:" ,this.ball.velocityX, this.ball.velocityY)

        const speed = Math.sqrt(this.ball.velocityX ** 2 + this.ball.velocityY ** 2);
        if (speed > this.maxBallSpeed) {
          const scale = this.maxBallSpeed / speed;
          this.ball.velocityX *= scale;
          this.ball.velocityY *= scale;
        }
      
        const slowDownFactor = 0.75; 
        if (playerSpeed < 800) { // apply slow if the player is moving below this threshold 
          //console.log('slow')
          this.ball.velocityX *= slowDownFactor;
          this.ball.velocityY *= slowDownFactor;
        }
      
      
        const overlap = (this.ball.radius + this.player.radius) - distance;
        if (overlap > 0) {
          this.ball.x += overlap * normalX;
          this.ball.y += overlap * normalY;
        }
      }
      this.ball.x += this.ball.velocityX;
      this.ball.y += this.ball.velocityY;
      this.keepBallInsideCanvas();
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
  
    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.beginPath();
      this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "green";
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "blue";
      this.ctx.fill();
      
    }
    

    start() {
      console.log("Game started");
    }
  }
  
  export default Game;
  