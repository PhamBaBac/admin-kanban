import io, { Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:8099";

export const initSocket = (accessToken: string, userId: string, role: string) => {
  // Truyền tham số vào URL cho netty-socketio Java
  const socket: Socket = io(
    `${SOCKET_URL}?accessToken=${accessToken}&userId=${userId}&role=${role}`,
    {
      transports: ["websocket"],
      reconnection: true,
    }
  );

  return socket;
};
