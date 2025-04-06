//import { Link } from "react-router-dom"

import { useNavigate } from 'react-router-dom'
import '../styles/Lobby.scss'
import { useContext, useEffect, useState } from 'react'
import { SocketContext } from '../context/SocketProvider'

export default function Lobby() {
    const navigate = useNavigate()
    const socket = useContext(SocketContext)

    const [isInitialState, setIsInitialState] = useState<boolean>(true) 
    const [isCreating, setIsCreating] = useState<boolean | null>(null)
    const [playerName, setPlayerName] = useState<string>("")
    const [lobbies, setLobbies] = useState({})

    function creatingRoom() {
        setIsInitialState(false)
        setIsCreating(true)
        
    }


    function joiningRoom() {
        setIsInitialState(false)
        setIsCreating(false)
    }

    function createRoom() {
        //navigate('/multiplayer/4')

        // sessionStorage.setItem("playerId", playerId);
        // sessionStorage.setItem("playerName", playerName);
        if (!playerName) {
            alert('enter your name')
            return
        }

        socket.emit("createLobby", { playerName }, (lobbyId: string) => {
            console.log(`Lobby : ${lobbyId} has been created`)
            sessionStorage.setItem("playerName", playerName);
            sessionStorage.setItem("lobbyId", lobbyId);
            
            navigate(`/multiplayer/${lobbyId}`);
        });
    }

    useEffect(()=> {
        socket.emit("getLobbies", (lobbies_: Record<string, { players: string[], gameStarted : boolean }>) => {
           setLobbies(lobbies_)
        })
        socket.on("updateLobbies", (updatedLobbies : Record<string, { players: string[], gameStarted : boolean }>) => { // trigger when backend use io.emit()
            setLobbies(updatedLobbies);
        });
        
        return () => {
            socket.off("updateLobbies"); 
        };
        
    }, [])

    // function joinLobby(lobbyId : string ) {
    //     if (!playerName) {
    //         alert('enter your name')
    //         return
    //     }
    //     socket.emit("joinLobby", {lobbyId, playerName})
    //     sessionStorage.setItem("player", playerName);
    //     sessionStorage.setItem("lobbyId", lobbyId);
    //     navigate(`/multiplayer/${lobbyId}`)
    // }

    function joinLobby(lobbyId: string) {
        if (!playerName) {
          alert('enter your name')
          return;
        }
      
        socket.emit("joinLobby", { lobbyId, playerName }, (response: { success: boolean; message?: string }) => {
          if (response.success) {
            sessionStorage.setItem("playerName", playerName);
            sessionStorage.setItem("lobbyId", lobbyId);
            navigate(`/multiplayer/${lobbyId}`);
          } else {
            alert(response.message || "Failed to join lobby");
          }
        });
    }
      

    return (
        <div className="lobby-page">
            {
                isInitialState? (
                    <div className='lobby-card'>
                        <button onClick={creatingRoom} className='button'>Create room</button>
                        <button onClick={joiningRoom} className='button'>Join room</button>
                    </div>
                ) : (
                    <div style={{color : "white"}} className='lobby-card'>
                        {
                            isCreating? (
                                <div>
                                    <input value={playerName} onChange={(e)=> setPlayerName(e.target.value)} placeholder='Type your name' type="text" />
                                    <button onClick={createRoom}> Create</button>
                                </div>
                            ) : (
                                <div>
                                    {
                                       Object.keys(lobbies).length > 0 ? (
                                        <div>
                                        <input value={playerName} onChange={(e)=> setPlayerName(e.target.value)} placeholder='Type your name' type="text" />
                                            {
                                                Object.keys(lobbies).map((lobbyid, i) => (
                                                    <div key={i}>
                                                        <div>{`Lobby : [${lobbyid}] by ${lobbies[lobbyid].players[0]}`}</div>
                                                        <button onClick={() => joinLobby(lobbyid)}>Join</button>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                       ) : (
                                        <div>
                                            <div>There is no lobby right now create lobby instead?</div>
                                            <button onClick={() => setIsCreating(true)}>Create</button>
                                        </div>
                                       ) 
                                    }
                                </div>
                            )
                        }
                    </div>
                )     
            } 
        </div>
    )
}
