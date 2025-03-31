class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    player: { x: number; y: number; radius : number };
    ai : {x: number; y: number; radius : number, speed : number}
    isDragging: boolean = false;
    ball: { x: number; y: number; radius: number; velocityX: number; velocityY: number };
    maxBallSpeed: number = 6.5;
    updateScore: (scoringSide: string) => void;
    

    goalHeight: number = 80;  
    goalYStart: number = (550 - 80) / 2; 
    goalYEnd: number = (550 + 80) / 2;  


    // to calculate cursor speed(player speed)
    playerSpeedX: number = 0;
    playerSpeedY: number = 0;
    lastMouseX: number = 0;
    lastMouseY: number = 0;
    lastTimestamp: number = performance.now();
  
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D,  updateScore: (scoringSide : string) => void) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.player = { x: 150, y: 275, radius : 40 };
      this.ai = {x: 950,  y: 275, radius: 40, speed: 3};
      this.ball = { 
        x: 550, 
        y: 275, // mid point of canvas + diameter
        radius: 20, 
        velocityX: 0, 
        velocityY: 0 
      };
      this.updateScore = updateScore

  
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

        if (newX + this.player.radius >= this.canvas.width / 2) {
          //console.log('passed')
          this.playerSpeedX = 0
          return
        }
        
        
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

    updateAI() {
      const targetY = this.ball.y; 
      const aiGoalX = this.canvas.width - 100; 
      const attackThreshold = this.canvas.width / 2; 
  
      
      if (this.ball.x > attackThreshold) {
          if (this.ai.x > this.ball.x) {
              this.ai.x -= this.ai.speed; 
          } else if (this.ai.x < this.ball.x) {
              this.ai.x += this.ai.speed; 
          }
      } else {
          
          if (this.ai.x > aiGoalX) {
              this.ai.x -= this.ai.speed;
          } else if (this.ai.x < aiGoalX) {
              this.ai.x += this.ai.speed; 
          }
      }
  
      if (this.ai.y < targetY) {
          this.ai.y += this.ai.speed; 
      } else if (this.ai.y > targetY) {
          this.ai.y -= this.ai.speed; 
      }
    }
  
    // updateBall() {
    //   const predictedX = this.ball.x + this.ball.velocityX;
    //   const predictedY = this.ball.y + this.ball.velocityY;

    //   if (this.isGoal(predictedX, predictedY)) {
    //     this.handleGoal(predictedX < this.canvas.width / 2 ? "right" : "left");
    //     return; // Stop further processing for this frame
    //   }
    
    //   // check wall
    //   if (predictedX - this.ball.radius <= 0 || predictedX + this.ball.radius >= this.canvas.width) {
    //     this.ball.velocityX *= -1; // Reverse X velocity upon wall collision
    //   }
    //   if (predictedY - this.ball.radius <= 0 || predictedY + this.ball.radius >= this.canvas.height) {
    //     this.ball.velocityY *= -1; // Reverse Y velocity upon wall collision
    //   }
    
    //   if (this.isColliding(this.player, predictedX, predictedY)) {
        
    //     const dx = this.ball.x - this.player.x;
    //     const dy = this.ball.y - this.player.y;
    //     const distance = Math.sqrt(dx * dx + dy * dy);
    //     const normalX = dx / distance;
    //     const normalY = dy / distance;
      
    //     const dotProduct = this.ball.velocityX * normalX + this.ball.velocityY * normalY;
    //     this.ball.velocityX -= 2 * dotProduct * normalX;
    //     this.ball.velocityY -= 2 * dotProduct * normalY;
      
    //     //const playerSpeed = Math.sqrt(this.playerSpeedX ** 2 + this.playerSpeedY ** 2);
    //     //console.log(this.playerSpeedX, this.playerSpeedY)
    //     const speedFactor = 0.002; // Adjust how much player speed affects the ball
    //     //console.log("player:" ,this.playerSpeedX, this.playerSpeedY, playerSpeed)
    //     this.ball.velocityX += this.playerSpeedX * speedFactor;
    //     this.ball.velocityY += this.playerSpeedY * speedFactor;
    //     //console.log("ball:" ,this.ball.velocityX, this.ball.velocityY)

    //     const speed = Math.sqrt(this.ball.velocityX ** 2 + this.ball.velocityY ** 2);
    //     if (speed > this.maxBallSpeed) {
    //       const scale = this.maxBallSpeed / speed;
    //       this.ball.velocityX *= scale;
    //       this.ball.velocityY *= scale;
    //     }
      
    //     // const slowDownFactor = 0.75; 
    //     // if (playerSpeed < 800) { // apply slow if the player is moving below this threshold 
    //     //   //console.log('slow')
    //     //   this.ball.velocityX *= slowDownFactor;
    //     //   this.ball.velocityY *= slowDownFactor;
    //     // }
      
      
    //     const overlap = (this.ball.radius + this.player.radius) - distance;
    //     if (overlap > 0) {
    //       this.ball.x += overlap * normalX;
    //       this.ball.y += overlap * normalY;
    //     }
    //   }

    //   this.ball.x += this.ball.velocityX;
    //   this.ball.y += this.ball.velocityY;
    //   this.keepBallInsideCanvas();
    // }

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
  

      if (this.isColliding(this.ai, predictedX, predictedY)) {
          this.handleCollision(this.ai);
      }
  
      this.ball.x += this.ball.velocityX;
      this.ball.y += this.ball.velocityY;
      this.keepBallInsideCanvas();
  }
  
  // Function to handle collision response
  // handleCollision(entity: { x: number; y: number; radius: number }) {
  //     const dx = this.ball.x - entity.x;
  //     const dy = this.ball.y - entity.y;
  //     const distance = Math.sqrt(dx * dx + dy * dy);
  //     const normalX = dx / distance;
  //     const normalY = dy / distance;
  
  //     // Reflect ball's velocity
  //     const dotProduct = this.ball.velocityX * normalX + this.ball.velocityY * normalY;
  //     this.ball.velocityX -= 2 * dotProduct * normalX;
  //     this.ball.velocityY -= 2 * dotProduct * normalY;

      
  
  //     // Apply entity movement impact
  //     const speedFactor = 0.007; 
  //     this.ball.velocityX += this.playerSpeedX * speedFactor;
  //     this.ball.velocityY += this.playerSpeedY * speedFactor;
  
  //     // Speed limit enforcement
  //     const speed = Math.sqrt(this.ball.velocityX ** 2 + this.ball.velocityY ** 2);
  //     if (speed > this.maxBallSpeed) {
  //         const scale = this.maxBallSpeed / speed;
  //         this.ball.velocityX *= scale;
  //         this.ball.velocityY *= scale;
  //     }
  //     const minSpeed = 1.5; 
  //     if (speed < minSpeed) {
  //       const scale = minSpeed / speed;
  //       this.ball.velocityX *= scale;
  //       this.ball.velocityY *= scale;
  //     }
  
  //     // Resolve overlap
  //     const overlap = (this.ball.radius + entity.radius) - distance;
  //     if (overlap > 0) {
  //         this.ball.x += overlap * normalX;
  //         this.ball.y += overlap * normalY;
  //     }
  // }

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
      this.ctx.arc(this.ai.x, this.ai.y, this.ai.radius, 0, Math.PI * 2);
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
  
  export default Game;
  