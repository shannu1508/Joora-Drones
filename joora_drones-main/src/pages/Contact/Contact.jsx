import React from "react";
import { Link } from "react-router-dom";
import "./Contact.css";

import { BsInstagram, BsFacebook, BsYoutube, BsLinkedin } from "react-icons/bs";
const Contact = () => {
  const infoHeading = ["Phone", "Email", "Address"];

  const infoDesc = [
    "+91 9493397117",
    "contact@jooradrones.com",
    "Joora drones private limited, \n 2nd Floor, A Hub, AU North Campus, Andhra University, Visakhapatnam, AP - 530013",
  ];

  const infoLinks = [
    "tel: +91 9493397117",
    "mailto: contact@jooradrones.com",
    "https://goo.gl/maps/AyGG2mYhZ6uV1Cum7",
  ];

  const names = [
    "Land Surveying",
    "3D Mapping",
    "Drone Inspection",
    "Photography",
  ];

  const pathNames = [
    "/land_surveying",
    "/mapping",
    "/inspection",
    "/photography",
  ];

  const companyInfo = infoHeading.map((title, index) => {
    return (
      <div className="list">
        <h3>{title}:</h3>
        <a href={infoLinks[index]}>
          {infoDesc[index].split("\n").map((i) => {
            return <p>{i}</p>;
          })}
        </a>
      </div>
    );
  });

  const services = names.map((service, index) => {
    return (
      <div className="service">
        <Link to={pathNames[index]} target="_blank">
          <h4>{service}</h4>
        </Link>
      </div>
    );
  });

  return (
    <div id="Contact">
      <div className="footer">
        <div className="company__info">{companyInfo}</div>
        <div className="services__section">
          <h3 id="title">Services</h3>
          <div className="list">{services}</div>
        </div>

        <div className="socialMedia">
          <h3 id="heading">Let's Connect</h3>
          <div className="icons">
            <a target="_" href="https://www.instagram.com/joora_drones/">
              <BsInstagram color="white" />
            </a>
            <a target="_" href="https://www.facebook.com/Jooradroneconsultants">
              <BsFacebook color="white" />
            </a>
            <a target="_" href="https://www.youtube.com/@jooradrones7215">
              <BsYoutube color="white" />
            </a>
            <a
              target="_"
              href="https://www.linkedin.com/company/joora-drone-consultants/"
            >
              <BsLinkedin color="white" />
            </a>
          </div>
        </div>
      </div>
      <div className="copyrights">© Joora Drones. All rights reserved</div>
    </div>
  );
};

export default Contact;
