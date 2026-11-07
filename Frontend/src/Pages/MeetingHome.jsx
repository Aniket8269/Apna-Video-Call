import { useContext, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Copy, Link2, Video } from "lucide-react";
import styles from "../styles/meetinghome.module.css";
import AuthContext from "../Contexts/AuthContext";

const createRoomId = () =>
  globalThis.crypto?.randomUUID?.().slice(0, 8) ??
  Math.random().toString(36).slice(2, 10);

const getRoomId = (value) => {
  const input = value.trim();
  if (!input) return "";
  try {
    const parsed = new URL(input, window.location.origin);
    return parsed.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return input.replace(/^\/+|\/+$/g, "");
  }
};

export default function MeetingHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userData, logout } = useContext(AuthContext);
  const [roomLink, setRoomLink] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const isGuest = searchParams.get("guest") === "true" && !userData;

  const createMeeting = () => {
    const roomId = createRoomId();
    window.sessionStorage.setItem(`video-meet-host:${roomId}`, "true");
    setRoomLink(`${window.location.origin}/${roomId}`);
    setNotice("");
    setCopied(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setNotice("");
    } catch (error) {
      console.error("Could not copy the meeting invite:", error);
      setNotice("Copy failed. You can select and copy the link above.");
    }
  };

  const joinMeeting = (event) => {
    event.preventDefault();
    const roomId = getRoomId(joinInput);
    if (!roomId || roomId === "auth" || roomId === "welcome") {
      setNotice("Enter a valid meeting link or room code.");
      return;
    }
    navigate(`/${encodeURIComponent(roomId)}`);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand} href="/">
          <span className={styles.brandIcon}><Video size={19} /></span>
          <span>
            <span className={styles.brandName}>Apna</span>{" "}
            <span className={styles.brandAccent}>Video Call</span>
          </span>
        </p>
        <div className={styles.accountActions}>
          <span className={styles.headerNote}>
            {isGuest ? "Guest mode" : `Signed in as ${userData?.name}`}
          </span>
          {userData ? (
            <button
              type="button"
              className={styles.accountButton}
              onClick={() => {
                logout();
                navigate("/", { replace: true });
              }}
            >
              Sign out
            </button>
          ) : (
            <Link className={styles.accountButton} to="/auth?mode=register">
              Create account
            </Link>
          )}
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>MAKE ROOM FOR GOOD CONVERSATIONS</p>
          <h1>Meet face to face, wherever you are.</h1>
          <p className={styles.description}>
            Start a video meeting in seconds, then share one simple link with
            everyone you want to bring together.
          </p>
        </div>

        <section className={styles.meetingCard} aria-label="Create or join a meeting">
          <div className={styles.cardIcon}><Video size={22} /></div>
          <h2>Start a meeting</h2>
          <p>Create a private room and invite people with a link.</p>
          <button type="button" className={styles.createButton} onClick={createMeeting}>
            Create meeting link <ArrowRight size={17} />
          </button>

          {roomLink && (
            <div className={styles.inviteBox}>
              <label htmlFor="meeting-link">Your meeting link is ready</label>
              <div className={styles.linkRow}>
                <input id="meeting-link" value={roomLink} readOnly onFocus={(event) => event.target.select()} />
                <button type="button" onClick={copyLink} aria-label="Copy meeting link">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <button
                type="button"
                className={styles.startButton}
                onClick={() => navigate(`/${encodeURIComponent(getRoomId(roomLink))}`)}
              >
                Start this meeting
              </button>
            </div>
          )}

          <div className={styles.separator}><span>OR JOIN A MEETING</span></div>
          <form className={styles.joinForm} onSubmit={joinMeeting}>
            <label htmlFor="join-link">Meeting link or room code</label>
            <div className={styles.joinInputWrap}>
              <Link2 size={17} />
              <input
                id="join-link"
                value={joinInput}
                onChange={(event) => setJoinInput(event.target.value)}
                placeholder="Paste a link or enter a code"
                autoComplete="url"
              />
              <button type="submit" aria-label="Join meeting"><ArrowRight size={18} /></button>
            </div>
          </form>
          {notice && <p className={styles.notice} role="status">{notice}</p>}
        </section>
      </section>

      <footer className={styles.footer}>
        <span>Apna Video Call</span>
        <span>Good conversations start here.</span>
      </footer>
    </main>
  );
}
