# Apna Video Call

Apna Video Call is a browser-based video meeting app. People can create a room and share its link, join a room as a guest, or create an account to use the signed-in experience. Meetings support live audio and video, screen sharing, participant status, and an in-room text chat.

The project is split into a React/Vite frontend and an Express/Socket.IO backend. MongoDB stores registered user accounts; Socket.IO handles room membership, WebRTC signaling, and chat delivery.

## Features

- Landing page with registration, login, and guest entry points.
- Account registration and login, with passwords hashed by bcrypt on the server. The frontend keeps the returned session token and basic profile details in browser local storage.
- Meeting home page for creating a room link or joining with a room code/link.
- Guest access without registration.
- Browser camera and microphone access, with controls to toggle each during a call.
- Peer-to-peer audio/video using WebRTC, with Socket.IO used to exchange signaling messages.
- Screen sharing, participant tiles, host indication, and a waiting state when alone in a room.
- In-meeting chat, with messages relayed to current participants and replayed to new arrivals while the room remains active.
- Responsive layouts for the landing page, meeting home, lobby, and call controls.
- App styling uses a navy background with orange accents; the lobby and account pages use a light palette.

## Tech stack

**Frontend**

- React 19 and React Router
- Vite
- Material UI for the authentication page
- Lucide icons
- Axios for account API requests
- Socket.IO client and browser WebRTC APIs for meetings

**Backend**

- Node.js with Express
- Socket.IO for meeting rooms, chat, and WebRTC signaling
- MongoDB with Mongoose
- bcrypt for password hashing

## Project structure

```text
Project/
├── Backend/
│   ├── src/
│   │   ├── app.js                  # Express, MongoDB, and HTTP/Socket.IO startup
│   │   ├── controllers/
│   │   │   ├── socketManager.js    # Room membership, signaling, and chat
│   │   │   └── user.controller.js  # Registration and login
│   │   ├── models/                 # User and meeting schemas
│   │   └── routes/users.routes.js  # User API routes
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── Contexts/               # Authentication state
    │   ├── Pages/                  # Landing, authentication, home, and call pages
    │   ├── styles/                 # Page and meeting styles
    │   ├── App.jsx                 # Client-side routes
    │   └── main.jsx                # React entry point
    └── package.json
```

## Requirements

- Node.js and npm
- A MongoDB connection string for the backend
- A modern browser with camera/microphone support

Camera, microphone, and screen-sharing access require browser permission. Media APIs generally require HTTPS in production; `localhost` is allowed for local development.

## Local development

### 1. Configure MongoDB

The backend connects to MongoDB from `Backend/src/app.js`. Configure the connection string there for your MongoDB deployment before starting the backend. Keep credentials private and do not commit them to source control.

### 2. Start the backend

From the project root:

```powershell
cd .\Backend
npm install
npm run dev
```

The server listens on port `8000` by default. Set `PORT` to use another port. The frontend account API currently targets `http://localhost:8000/api/v1/users`.

### 3. Start the frontend

Open another terminal from the project root:

```powershell
cd .\Frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your browser. The meeting signaling client uses `http://localhost:8000` by default. Set `VITE_SERVER_URL` in the frontend environment to point meeting signaling at a different server URL. If you change the backend port, update the account API base URL in `Frontend/src/Contexts/AuthContext.jsx` as well.

## Available commands

Run these commands from the corresponding `Frontend` or `Backend` directory.

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and Socket.IO server with Nodemon |
| `npm start` | Start the API and Socket.IO server |
| `npm run prod` | Start the server with PM2 |

## Routes and API

### Frontend routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/welcome` | Landing page alias |
| `/auth?mode=register` | Registration form |
| `/auth?mode=login` | Login form |
| `/home` | Signed-in meeting home |
| `/home?guest=true` | Guest meeting home |
| `/:roomCode` | Meeting lobby and call |

Signing in or registering takes the user to `/home`. Ending a call returns a signed-in user to `/home` and a guest to `/home?guest=true`.

### User API

The backend mounts user routes under `/api/v1/users`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/register` | Create an account |
| `POST` | `/login` | Verify credentials and return a session token |

Meeting rooms and chat are managed through Socket.IO rather than REST endpoints. The room server relays `join-call`, `user-joined`, `user-left`, `signal`, and `chat-message` events.

## Notes and current limitations

- Meetings are not persisted as meeting records. The project includes a meeting schema, but meeting-history routes are not implemented.
- Chat history is held in backend memory for the lifetime of an active room and is cleared after the last participant leaves. It is not stored in MongoDB.
- Peer-to-peer connectivity uses a public STUN server. Some network setups may require TURN support for reliable connections.
- The Socket.IO server currently allows cross-origin connections from any origin; configure this appropriately before production deployment.
- The account API URL is currently hard-coded to localhost in the frontend authentication context. The meeting signaling URL supports `VITE_SERVER_URL`.
- No automated frontend or backend test suite is currently configured.
