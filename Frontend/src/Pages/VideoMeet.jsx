import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Copy,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  PhoneOff,
  Send,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { io } from "socket.io-client";
import styles from "../styles/VideoComponent.module.css";
import AuthContext from "../Contexts/AuthContext";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

export default function VideoMeetComponent() {
  const { url: roomId } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const connectionsRef = useRef({});
  const pendingIceRef = useRef({});
  const [username, setUsername] = useState(userData?.name ?? "");
  const [joined, setJoined] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [hostSocketId, setHostSocketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const roomLink = `${window.location.origin}/${roomId}`;
  const isRoomHost =
    window.sessionStorage.getItem(`video-meet-host:${roomId}`) === "true";

  const closeConnections = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    Object.values(connectionsRef.current).forEach((connection) => {
      connection.close();
    });
    connectionsRef.current = {};
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  useEffect(() => closeConnections, [closeConnections]);

  const negotiate = async (connection, peerId) => {
    if (connection.signalingState !== "stable") return;
    try {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      socketRef.current?.emit(
        "signal",
        peerId,
        JSON.stringify({ sdp: connection.localDescription }),
      );
    } catch (negotiationError) {
      console.error("Could not negotiate a peer connection:", negotiationError);
      setError("A participant connection could not be established.");
    }
  };

  const createPeerConnection = (peerId, shouldOffer) => {
    if (connectionsRef.current[peerId]) return;

    const connection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    connectionsRef.current[peerId] = connection;

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit(
          "signal",
          peerId,
          JSON.stringify({ ice: event.candidate }),
        );
      }
    };

    connection.ontrack = (event) => {
      const stream =
        event.streams[0] ?? new MediaStream([event.track]);
      setParticipants((current) => {
        const existing = current.find((participant) => participant.id === peerId);
        if (existing) {
          return current.map((participant) =>
            participant.id === peerId ? { ...participant, stream } : participant,
          );
        }
        return [...current, { id: peerId, stream }];
      });
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      connection.addTrack(track, localStreamRef.current);
    });

    connection.onnegotiationneeded = () => {
      if (shouldOffer) void negotiate(connection, peerId);
    };
  };

  const handleSignal = async (fromId, messageData) => {
    const connection = connectionsRef.current[fromId];
    if (!connection) return;

    try {
      const signal = JSON.parse(messageData);
      if (signal.sdp) {
        await connection.setRemoteDescription(
          new RTCSessionDescription(signal.sdp),
        );
        const pendingCandidates = pendingIceRef.current[fromId] ?? [];
        delete pendingIceRef.current[fromId];
        for (const candidate of pendingCandidates) {
          await connection.addIceCandidate(candidate);
        }
        if (signal.sdp.type === "offer") {
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          socketRef.current?.emit(
            "signal",
            fromId,
            JSON.stringify({ sdp: connection.localDescription }),
          );
        }
      }
      if (signal.ice) {
        const candidate = new RTCIceCandidate(signal.ice);
        if (connection.remoteDescription) {
          await connection.addIceCandidate(candidate);
        } else {
          pendingIceRef.current[fromId] ??= [];
          pendingIceRef.current[fromId].push(candidate);
        }
      }
    } catch (signalError) {
      console.error("Could not process a participant connection:", signalError);
      setError("A participant connection could not be established.");
    }
  };

  const connectToRoom = () => {
    const socket = io(serverUrl);
    socketRef.current = socket;
    socket.on("signal", handleSignal);
    socket.on("connect_error", (connectionError) => {
      console.error("Could not connect to the meeting server:", connectionError);
      setError("Could not connect to the meeting server. Please try again.");
    });
    socket.on("chat-message", (data, sender, senderId) => {
      setMessages((current) => [
        ...current,
        {
          id: `${senderId}-${Date.now()}-${current.length}`,
          sender: sender || "Participant",
          senderId,
          text: String(data),
        },
      ]);
    });
    socket.on("user-left", (id) => {
      connectionsRef.current[id]?.close();
      delete connectionsRef.current[id];
      delete pendingIceRef.current[id];
      setParticipants((current) =>
        current.filter((participant) => participant.id !== id),
      );
      setHostSocketId((current) => (current === id ? null : current));
    });
    socket.on("user-joined", (id, clients) => {
      setHostSocketId((current) => current ?? clients[0] ?? null);
      clients.forEach((peerId) => {
        if (peerId !== socketIdRef.current) {
          createPeerConnection(peerId, id === socketIdRef.current);
        }
      });
    });
    socket.on("connect", () => {
      socketIdRef.current = socket.id;
      socket.emit("join-call", window.location.href);
    });
  };

  const joinMeeting = async (event) => {
    event.preventDefault();
    if (!username.trim()) {
      setError("Enter your name to join the meeting.");
      return;
    }

    setError("");
    const stream = new MediaStream();
    try {
      const availableStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      availableStream.getTracks().forEach((track) => stream.addTrack(track));
    } catch (mediaError) {
      console.warn("Could not access camera and microphone together:", mediaError);
      for (const kind of ["video", "audio"]) {
        try {
          const availableStream = await navigator.mediaDevices.getUserMedia({
            [kind]: true,
          });
          availableStream.getTracks().forEach((track) => stream.addTrack(track));
        } catch (deviceError) {
          console.info(`No ${kind} device is available:`, deviceError);
        }
      }
    }

    const cameraTrack = stream.getVideoTracks()[0];
    const microphoneTrack = stream.getAudioTracks()[0];
    if (cameraTrack) cameraTrack.enabled = videoEnabled;
    if (microphoneTrack) microphoneTrack.enabled = audioEnabled;
    setVideoEnabled(Boolean(cameraTrack?.enabled));
    setAudioEnabled(Boolean(microphoneTrack?.enabled));
    if (!cameraTrack || !microphoneTrack) {
      setError("Camera or microphone access is unavailable. You can still join.");
    }

    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    setJoined(true);
    connectToRoom();
  };

  const toggleTrack = async (kind) => {
    const enabled = kind === "video" ? videoEnabled : audioEnabled;
    const setter = kind === "video" ? setVideoEnabled : setAudioEnabled;
    const track = localStreamRef.current?.getTracks().find(
      (currentTrack) => currentTrack.kind === kind,
    );

    if (track) {
      track.enabled = !enabled;
      setter(!enabled);
      return;
    }

    if (!enabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          [kind]: true,
        });
        const newTrack = stream.getTracks()[0];
        if (!newTrack) throw new Error(`No ${kind} track was provided.`);
        localStreamRef.current?.addTrack(newTrack);
        newTrack.enabled = true;
        if (kind === "video" && screenStreamRef.current) {
          setter(true);
          setError("");
          return;
        }
        if (kind === "video" && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        for (const [peerId, connection] of Object.entries(
          connectionsRef.current,
        )) {
          const sender = connection
            .getSenders()
            .find((currentSender) => currentSender.track?.kind === kind);
          if (sender) {
            await sender.replaceTrack(newTrack);
          } else {
            connection.addTrack(newTrack, localStreamRef.current);
            await negotiate(connection, peerId);
          }
        }
        setter(true);
        setError("");
      } catch (mediaError) {
        console.error(`Could not enable ${kind}:`, mediaError);
        setError(`Could not turn on your ${kind}. Check your device permissions.`);
      }
    }
  };

  const stopScreenShare = async () => {
    const stream = screenStreamRef.current;
    if (!stream) return;
    screenStreamRef.current = null;
    stream.getTracks().forEach((track) => track.stop());
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
    try {
      for (const [peerId, connection] of Object.entries(connectionsRef.current)) {
        const sender = connection
          .getSenders()
          .find((currentSender) => currentSender.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(cameraTrack);
        }
        if (!sender && cameraTrack) {
          connection.addTrack(cameraTrack, localStreamRef.current);
          await negotiate(connection, peerId);
        }
      }
    } catch (shareError) {
      console.error("Could not restore the camera video:", shareError);
      setError("Screen sharing stopped, but your camera could not be restored.");
    } finally {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenShare(false);
    }
  };

  const toggleScreenShare = async () => {
    if (screenShare) {
      await stopScreenShare();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error("The browser did not provide a screen track.");
      screenStreamRef.current = stream;
      track.onended = () => void stopScreenShare();
      for (const [peerId, connection] of Object.entries(connectionsRef.current)) {
        const sender = connection
          .getSenders()
          .find((currentSender) => currentSender.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(track);
        } else {
          connection.addTrack(track, stream);
          await negotiate(connection, peerId);
        }
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setScreenShare(true);
      setError("");
    } catch (shareError) {
      if (screenStreamRef.current) await stopScreenShare();
      if (shareError.name !== "NotAllowedError") {
        console.error("Could not share the screen:", shareError);
        setError("Screen sharing could not be started.");
      }
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !socketRef.current?.connected) return;
    socketRef.current.emit("chat-message", text, username.trim());
    setMessage("");
  };

  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error("Could not copy the meeting link:", copyError);
      setError("Could not copy the link. Copy it from the address bar instead.");
    }
  };

  const leaveMeeting = () => {
    closeConnections();
    setJoined(false);
    navigate(userData ? "/home" : "/home?guest=true", { replace: true });
  };

  const renderTile = (id, stream, name, isHost, local = false) => (
    <article
      className={`${styles.participantTile} ${isHost ? styles.hostTile : ""} ${
        local ? styles.localTile : ""
      }`}
      key={id}
    >
      {local ? (
        <video
          ref={(element) => {
            localVideoRef.current = element;
            if (
              element &&
              localStreamRef.current &&
              element.srcObject !== (screenStreamRef.current ?? localStreamRef.current)
            ) {
              element.srcObject = screenStreamRef.current ?? localStreamRef.current;
            }
          }}
          autoPlay
          muted
          playsInline
        />
      ) : (
        <video
          autoPlay
          playsInline
          ref={(element) => {
            if (element && stream && element.srcObject !== stream) {
              element.srcObject = stream;
            }
          }}
        />
      )}
      {local && !videoEnabled && !screenShare && (
        <div className={styles.cameraOffOverlay}>
          <span>{name.slice(0, 1).toUpperCase()}</span>
          <small><VideoOff size={17} /> Camera off</small>
        </div>
      )}
      <div className={styles.tileCaption}>
        <span>{name}{isHost ? " · Host" : ""}{local ? " (You)" : ""}</span>
        {local && !audioEnabled && <MicOff size={15} aria-label="Muted" />}
      </div>
    </article>
  );

  if (!joined) {
    return (
      <main className={styles.lobby}>
        <section className={styles.lobbyCard}>
          <p className={styles.lobbyBrand}>
            Apna <span>Video Call</span>
          </p>
          <p className={styles.eyebrow}>MEETING ROOM</p>
          <h1>Ready when you are.</h1>
          <p className={styles.lobbyDescription}>
            Choose a name and join the conversation. Your camera and microphone
            can be switched off at any time.
          </p>
          <form onSubmit={joinMeeting} className={styles.joinForm}>
            <label htmlFor="meeting-name">Your name</label>
            <input
              id="meeting-name"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. Alex Morgan"
              autoComplete="name"
              maxLength={40}
            />
            <div className={styles.lobbyOptions}>
              <button
                type="button"
                className={`${styles.optionButton} ${!videoEnabled ? styles.optionOff : ""}`}
                onClick={() => setVideoEnabled((current) => !current)}
              >
                {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                Camera {videoEnabled ? "on" : "off"}
              </button>
              <button
                type="button"
                className={`${styles.optionButton} ${!audioEnabled ? styles.optionOff : ""}`}
                onClick={() => setAudioEnabled((current) => !current)}
              >
                {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                Mic {audioEnabled ? "on" : "off"}
              </button>
            </div>
            {error && <p className={styles.errorMessage}>{error}</p>}
            <button type="submit" className={styles.joinButton}>Join meeting</button>
          </form>
          <button type="button" className={styles.copyLink} onClick={copyRoomLink}>
            <Copy size={16} /> {copied ? "Link copied" : "Copy meeting link"}
          </button>
        </section>
      </main>
    );
  }

  const isLocalHost = isRoomHost || socketIdRef.current === hostSocketId;

  return (
    <main className={styles.meeting}>
      <header className={styles.meetingHeader}>
        <p className={styles.brand} href="/">Apna Video Call</p>
        <div className={styles.meetingInfo}>
          <span className={styles.liveDot} />
          <span>Meeting</span>
          <span className={styles.roomId}>{roomId}</span>
        </div>
        <button type="button" className={styles.headerLink} onClick={copyRoomLink}>
          <Copy size={16} /> {copied ? "Copied" : "Invite"}
        </button>
      </header>

      <section className={styles.stage}>
        <div className={styles.participantGrid}>
          {participants.map((participant) => {
            const isHost = participant.id === hostSocketId;
            return renderTile(
              participant.id,
              participant.stream,
              `Guest ${participant.id.slice(0, 5)}`,
              isHost,
            );
          })}
          {renderTile(
            socketIdRef.current || "you",
            localStreamRef.current,
            username.trim(),
            isLocalHost,
            true,
          )}
          {participants.length === 0 && (
            <div className={styles.waitingCard}>
              <div className={styles.waitingIcon}><Users size={24} /></div>
              <h2>You're the first one here</h2>
              <p>Invite someone to join you in this meeting.</p>
              <button type="button" onClick={copyRoomLink}>
                <Copy size={16} /> {copied ? "Link copied" : "Copy invite link"}
              </button>
            </div>
          )}
        </div>

        {chatOpen && (
          <aside className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <div><h2>Meeting chat</h2><span>{messages.length} messages</span></div>
              <button type="button" onClick={() => setChatOpen(false)} aria-label="Close chat">
                <X size={19} />
              </button>
            </div>
            <div className={styles.messageList}>
              {messages.length === 0 ? (
                <p className={styles.emptyChat}>Messages shared here are visible to everyone.</p>
              ) : messages.map((item) => (
                <div className={styles.messageItem} key={item.id}>
                  <strong>{item.sender}{item.senderId === socketIdRef.current ? " (You)" : ""}</strong>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
            <form className={styles.messageForm} onSubmit={sendMessage}>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Send a message..."
                aria-label="Chat message"
                maxLength={1000}
              />
              <button type="submit" aria-label="Send message" disabled={!message.trim()}>
                <Send size={17} />
              </button>
            </form>
          </aside>
        )}
      </section>

      {error && <p className={styles.meetingError}>{error}</p>}
      <footer className={styles.controlBar}>
        <div className={styles.controlGroup}>
          <button
            type="button"
            className={`${styles.controlButton} ${!videoEnabled ? styles.controlOff : ""}`}
            onClick={() => void toggleTrack("video")}
            aria-label={videoEnabled ? "Turn camera off" : "Turn camera on"}
          >
            {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            <span>{videoEnabled ? "Camera" : "Start video"}</span>
          </button>
          <button
            type="button"
            className={`${styles.controlButton} ${!audioEnabled ? styles.controlOff : ""}`}
            onClick={() => void toggleTrack("audio")}
            aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            <span>{audioEnabled ? "Mic" : "Unmute"}</span>
          </button>
          <button
            type="button"
            className={`${styles.controlButton} ${screenShare ? styles.controlActive : ""}`}
            onClick={() => void toggleScreenShare()}
            aria-label={screenShare ? "Stop sharing screen" : "Share screen"}
          >
            {screenShare ? <MonitorX size={20} /> : <MonitorUp size={20} />}
            <span>{screenShare ? "Stop share" : "Share"}</span>
          </button>
          <button
            type="button"
            className={`${styles.controlButton} ${chatOpen ? styles.controlActive : ""}`}
            onClick={() => setChatOpen((open) => !open)}
            aria-label="Toggle meeting chat"
          >
            <MessageSquare size={20} />
            <span>Chat{messages.length > 0 ? ` · ${messages.length}` : ""}</span>
          </button>
        </div>
        <div className={styles.participantCount}>
          <Users size={17} /> {participants.length + 1}
        </div>
        <button
          type="button"
          className={styles.leaveButton}
          onClick={leaveMeeting}
          aria-label="Leave meeting"
        >
          <PhoneOff size={19} /><span>Leave</span>
        </button>
      </footer>
    </main>
  );
}
