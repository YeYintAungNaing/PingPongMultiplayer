import { useEffect, useRef, useState } from "react";
import Game from "../classes/onlinegame";
import '../styles/Multiplayer.scss'
import { useParams } from "react-router-dom";
import socket from "../socket/socket";

interface Lobby {
   players : string[] ;
   
}

function Multiplayer() {
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number[]>([0, 0])
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameInitiated, setGameInitiated] = useState<boolean>(false)
  const [players, setPlayers] = useState<string[]>([])
  const {lobbyId} = useParams()
  const [message, setMessage] = useState<string>("Waiting for opponent")
  
  //const [manualEffect, setManualEffect] = useState<number>(0)


  //console.log(lobbyId)

  useEffect(() => {
    // const handlePopState = () => {
    //   socket.emit("leave-lobby", lobbyId);
    //   console.log('leave')
    // }
    // window.addEventListener("popstate", handlePopState); 
    
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

    const startGame = () => {
      const currentPlayer = sessionStorage.getItem("playerName")

      if (currentPlayer) {
        socket.emit('getGameState', lobbyId, (response) => {
            if (response.success) {
              const currentGameState = response.currentGameState
              const currentPlayers = Object.keys(currentGameState);
              const [p1Name, p2Name] = currentPlayers;
              
              const playerOnePosition = { 
                  ...currentGameState[p1Name], 
                  
                  playerName: p1Name 
              };
              
              const playerTwoPosition = { 
                  ...currentGameState[p2Name], 
    
                  playerName: p2Name 
              };
              const ball = currentGameState.ball
              console.log(ball)
            
              
              setPlayers(currentPlayers.slice(0, 2))
              getScoreAndMsg()
              socket.on('getScoreAndMsg', ()=> {
                getScoreAndMsg()
              })
             

              setGameInitiated(true);

              const game = new Game(canvas, ctx, playerOnePosition, playerTwoPosition, ball, socket, lobbyId, currentPlayer );

              const loop = () => {
                game.draw();
                animationFrameId = requestAnimationFrame(loop);
              };
              loop();
            }
            else {
              alert('error initiating game, please refresh')
            }
        })
      }
      else {
        alert('invalid player!')
      } 
    };
  
    
    socket.emit("getLobbyInfo", { lobbyId }, (lobbyInfo: Lobby) => {
      if (lobbyInfo.players.length === 2) {
        startGame();
      } 
      else {
        socket.on("gameReady", () => {  // only open the listener when the game is not started
          
          //socket.emit("getLobbyInfo", { lobbyId }, (lobbyInfo_ : Lobby) => {
          startGame();
          //});
        });
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameId)
      socket.off("gameReady")
      socket.off("getGameState")
      socket.off("getScoreAndMsg")
      socket.emit("leave-lobby", lobbyId);
    };

  }, [isGameOver]);


  // useEffect(()=> {
  //   socket.on("gameReady", () => { 
  //     setManualEffect(manualEffect+1)
  //   });
  // }, [])

  function getScoreAndMsg() {
      socket.emit("getScoreAndMsg", lobbyId, (scores : number[], msg : string) => {
        setScore(scores)
        //console.log(msg)
        setMessage(msg)
      })
  }


  useEffect(()=> {
    getScoreAndMsg()
  }, [])

  //console.log(score)
  function manualStart() {
    socket.emit("startGame", lobbyId)
  }

  return  (
      <div className="multiplayer">
        <div className="message">{message}</div>
          {
            gameInitiated && players.length === 2 && 
            <div className="scoreBoard">
              <button onClick={manualStart}>start</button>
             {`${players[0]} ${score[0]} : ${score[1]} ${players[1]}`}
            </div>
          }
        <canvas className="game-display" ref={canvasRef} width={1100} height={550}/>
      </div>
  )
};

export default Multiplayer;
