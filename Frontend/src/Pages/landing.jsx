import React from "react";
import "../App.css";
import bg from "../assets/bg.png";
import mobile from "../assets/mobile.png";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div
      className="landingPageContainer overflow-hidden"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <nav>
        <div className="navHeader">
          <h2><span style={{color:"#ffa500"}}>Apna</span> <span style={{color:"#ffffff"}}>Video Call</span></h2>
        </div>
        <div className="navList">
          <Link to="/home?guest=true">Join as guest</Link>
          <Link to="/auth?mode=register">Register</Link>
          <Link className="navLogin" to="/auth?mode=login">Login</Link>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1><span style={{color:"#ffa500"}}>Connect</span> with anyone, anywhere</h1>
          <p>Apna Video Call is a free and open-source video calling platform.</p>
          <div role="button">
            <Link to="/auth?mode=register">Get Started</Link>
          </div>
        </div>
        <div>
          <img src={mobile} alt="mobile" />
        </div>
      </div>

    </div>
  );
}