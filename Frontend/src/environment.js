const defaultServer = import.meta.env.DEV
  ? "http://localhost:8000"
  : "https://apna-video-call-server.onrender.com";
const server = (import.meta.env.VITE_SERVER_URL || defaultServer).replace(
  /\/+$/,
  "",
);

export default server;