import io, { Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:8099";

export const initSocket = (accessToken?: string) => {
  const queryParam = accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : "";
  const socket: Socket = io(`${SOCKET_URL}${queryParam}`, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return socket;
};
