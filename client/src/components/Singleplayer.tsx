import { useEffect, useRef } from "react";
import Game from "../classes/game";
import '../styles/Singleplayer.scss'

function Singleplayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const game = new Game(canvas, ctx);
   

    const loop = () => {
      //game.update();
      game.updateBall();
      game.draw();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return  (
      <div className="singleplayer">
        <canvas className="game-display" ref={canvasRef} width={1100} height={550}/>
      </div>
  )
};
export default Singleplayer;
