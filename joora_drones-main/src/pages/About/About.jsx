import React from "react";
import "./About.css";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();
  return (
    <div id="About">
      <div className="matter">
        <h1>About Us</h1>
        <p>
          Joora Drones is a renowned drone consulting company that offers a wide
          range of professional services. We provide drone based Land Surveying, Inspections & 3D
          Mapping of assets & infrastructure.
        </p>
        <h3 onClick={() => navigate("ContactForm")}>Contact</h3>
      </div>
      <div className="video">
        <div>
          <div></div>
          <iframe
            className="ytvideo"
            width="560"
            height="315"
            src="https://www.youtube.com/embed/JsHsnperoyw?rel=0"
            title="Telemetry Photography"
            frameborder="0"
            allow="autoplay; encrypted-media;"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default About;
