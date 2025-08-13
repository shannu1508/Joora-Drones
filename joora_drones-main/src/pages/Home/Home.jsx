import React from "react";
import "./Home.css";
import bg from "../../assets/bg.webp";

const Home = () => {
  return (
    <div id="Home">
      <div className="bg">
        <img src={bg} alt="background image" />
        <div className="layer"></div>
      </div>
      <h1>
        Elevated Perspective <br /> Endless Possibilities <br />
      </h1>
    </div>
  );
};

export default Home;
