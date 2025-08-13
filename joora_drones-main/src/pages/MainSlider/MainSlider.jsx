import React from "react";
import ReactCompareImage from "react-compare-image";
import drones from "../../assets/abstract/drones.webp";

import "./MainSlider.css";

import Image1 from "../../assets/services/mapping/urban.webp";
import Image2 from "../../assets/services/mapping/urban2.webp";

const MainSlider = () => {
  return (
    <div className="main__slider">
      <img className="sliderBg" src={drones} alt="background" />
      <h1>Planimetrics</h1>
      <div className="slider">
        <ReactCompareImage leftImage={Image1} rightImage={Image2} />
      </div>
    </div>
  );
};

export default MainSlider;
