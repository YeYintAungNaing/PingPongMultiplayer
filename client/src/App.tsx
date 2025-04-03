import { BrowserRouter, Route, Routes } from "react-router-dom"
import Menu from "./components/Menu"
import Singleplyer from "./components/Singleplayer"
import Multiplayer from "./components/Multiplayer"
import "./styles/App.scss"
import Lobby from "./components/Lobby"
import {SocketProvider} from "./context/SocketProvider"


function App() {

  return (
    <div className="app">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu/>} />
        <Route path="/singleplayer" element={<Singleplyer/>} />      
        <Route path="/lobby" element={ <SocketProvider><Lobby/></SocketProvider>} />
        <Route path="/multiplayer/:id" element={<SocketProvider><Multiplayer/></SocketProvider>} />
      </Routes>
    </BrowserRouter>
    </div>
  )
}

export default App