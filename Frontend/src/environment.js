let IS_PROD = true;

const server = IS_PROD ?
    "https://apna-video-call-server.onrender.com" :
    "https://localhost:8000"

export default server;