import PusherClient from "pusher-js";

export const pusherClient = new PusherClient("app-key", {
  cluster: "",
  httpHost: "127.0.0.1",
  httpPort: 6001,
  wsHost: "127.0.0.1",
  wsPort: 6001,
  wssPort: 6001,
  forceTLS: false,
  enabledTransports: ["ws", "wss"],
  authTransport: "ajax",
  authEndpoint: "/api/pusher-auth",
  auth: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});
