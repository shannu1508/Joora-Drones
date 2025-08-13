import React from "react";
import "./Services.css";

import { Link } from "react-router-dom";

// Images
import Surveying from "../../assets/services/surveying/survey.jpg";
import Inspection from "../../assets/services/inspection/inspection.webp";
import Mapping from "../../assets/services/mapping/mapping.webp";
import Aerial from "../../assets/services/photography/drone_photography.jpg"

const Services = () => {
  const names = [
    "Land Surveying",
    "Drone Inspections",
    "3D Mapping",
    "Photography",
  ];

  const imgs = [Surveying, Inspection, Mapping, Aerial];
  const pathNames = [
    "/land_surveying",
    "/inspection",
    "/mapping",
    "/photography"
  ]
  const services = names.map((service, index) => {
    return (
      <div className="service">
        <Link to={pathNames[index]} target="_blank">
          <img src={imgs[index]} alt={service} />
          <div></div>
          <h3>{service}</h3>
          </Link>
      </div>
    );
  });

  return (
    <div id="Services">
      <h1>Our Services</h1>
      <div className="container">{services}</div>
    </div>
  );
};

export default Services;
