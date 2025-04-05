import { useEffect, useRef, useState } from "react";
import Game from "../classes/onlinegame";
import '../styles/Singleplayer.scss'
import { useParams } from "react-router-dom";
import socket from "../socket/socket";

interface Lobby {
   players : string[] ;
   gameStarted : boolean
}

function Multiplayer() {
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number[]>([0, 0])
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameInitiated, setGameInitiated] = useState<boolean>(false)
  const [players, setPlayers] = useState<string[]>([])
  const {lobbyId} = useParams()
  //const [manualEffect, setManualEffect] = useState<number>(0)


  //console.log(lobbyId)

  useEffect(() => {
    if (isGameOver) {
      console.log('game over')
      return
    }
    if (gameInitiated) {
      console.log('already initated')
      return
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!lobbyId || lobbyId.length !== 6) {
      alert("invalid lobby id")
      return
    }
    const savedId = sessionStorage.getItem("lobbyId");
    if (lobbyId !== savedId) {
      alert('unauthorized user')
      return
    }

    let animationFrameId: number;

    const startGame = (players: string[]) => {
      const [p1, p2] = players;
      setPlayers(players);
      setGameInitiated(true);
  
      const game = new Game(canvas, ctx, p1, p2, updateScore, socket, lobbyId);
      // socket.on("gameStateUpdated", ({x , y}) => {
      //   console.log(x, y)
      // })
  
      const loop = () => {
        game.updateBall();
        game.draw();
        animationFrameId = requestAnimationFrame(loop);
      };
      loop();
    };
  
    
    socket.emit("getLobbyInfo", { lobbyId }, (lobbyInfo: Lobby) => {
      if (lobbyInfo.players.length === 2 && lobbyInfo.gameStarted) {
        startGame(lobbyInfo.players);
      } 
      else {
        socket.on("gameReady", () => {  // only open the listener when the game is not started
          
          socket.emit("getLobbyInfo", { lobbyId }, (lobbyInfo_ : Lobby) => {
            startGame(lobbyInfo_.players);
          });
        });
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameId)
      socket.off("gameReady")
      socket.off("gameStateUpdated")
    };

  }, [isGameOver]);


  // useEffect(()=> {
  //   socket.on("gameReady", () => { 
  //     setManualEffect(manualEffect+1)
  //   });
  // }, [])

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
          {
            gameInitiated && players.length === 2 && 
            <div className="scoreBoard">
             {`${players[0]} ${score[0]} : ${score[1]} ${players[1]}`}
            </div>
          }
        <canvas className="game-display" ref={canvasRef} width={1100} height={550}/>
      </div>
  )
};

export default Multiplayer;
