import { useEffect, useRef, useState } from "react";
import Game from "../classes/game";
import '../styles/Singleplayer.scss'


function Singleplayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number[]>([0, 0])
  const [isGameOver, setIsGameOver] = useState(false)

  useEffect(() => {
    if (isGameOver) {
      console.log('game over')
      return
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const game = new Game(canvas, ctx, updateScore);

    const loop = () => {
      //game.update();
      game.updateBall();
      game.updateAI()
      game.draw();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animationFrameId)
      
    };
  }, [isGameOver]);

  function updateScore(scoringSide: string) {
    setScore((prevScore) => {
      const newScore = [...prevScore];
  
      if (scoringSide === "left") {
        newScore[0] += 1;
      } 
      else {
        newScore[1] += 1;
      }

      if (newScore[0] >= 2 || newScore[1] >= 2) {
        setIsGameOver(true);
      }

      return newScore; 
    })
  }

  //console.log(score)

  return  (
      <div className="singleplayer">
        <div className="scoreBoard">
          {
            `${score[0]} : ${score[1]}`
          }
        </div>
        <canvas className="game-display" ref={canvasRef} width={1100} height={550}/>
      </div>
  )
};
export default Singleplayer;
