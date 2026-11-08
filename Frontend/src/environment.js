const defaultServer = import.meta.env.DEV
  ? "http://localhost:8000"
  : "https://apna-video-call-backend-r3hn.onrender.com"; // Your actual backend URL

const server = (import.meta.env.VITE_SERVER_URL || defaultServer).replace(
  /\/+$/,
  "",
);

export default server;