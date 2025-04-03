import { createContext, useEffect } from "react";
import socket from "../socket/socket.ts";

export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    socket.connect(); 

    return () => {
      socket.disconnect(); 
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};




