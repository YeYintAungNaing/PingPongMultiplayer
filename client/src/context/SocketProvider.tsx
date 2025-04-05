import { createContext, useEffect } from "react";
import socket from "../socket/socket.ts";

export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    socket.connect(); 

    socket.on("connect", () => {  // listen for connection event from backend
      const lobbyId = sessionStorage.getItem("lobbyId");
      const playerName = sessionStorage.getItem("playerName");
      
      if (lobbyId && playerName) {
        socket.emit("rejoinLobby", { lobbyId, playerName })
      }
    })


    return () => {
      socket.disconnect(); 
      socket.off("connect");
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};




