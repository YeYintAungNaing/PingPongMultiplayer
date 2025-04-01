//import { Link } from "react-router-dom"

import { useNavigate } from 'react-router-dom'
import '../styles/Lobby.scss'
import { useState } from 'react'

export default function Lobby() {
    const navigate = useNavigate()

    const [isInitialState, setIsInitialState] = useState<boolean>(true) 
    const [isCreating, setIsCreating] = useState<boolean | null>(null)

    function creatingRoom() {
        setIsInitialState(false)
        setIsCreating(true)
    }

    function joiningRoom() {
        setIsInitialState(false)
        setIsCreating(false)
    }

    function createRoom() {
        navigate('/multiplayer/4')
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
                                    <button onClick={createRoom}> Create</button>
                                </div>
                            ) : (
                                <div>joining</div>
                            )
                        }
                    </div>
                )     
            } 
        </div>
    )
}
