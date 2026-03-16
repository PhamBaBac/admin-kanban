import io, { Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:8099";

export const initSocket = (accessToken: string) => {
  const socket: Socket = io(
    `${SOCKET_URL}?accessToken=${accessToken}`,
    {
      transports: ["websocket"],
      reconnection: true,
    }
  );

  return socket;
};
