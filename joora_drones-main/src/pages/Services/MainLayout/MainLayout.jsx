import React, { useEffect } from "react";
import "./MainLayout.css";
import Navbar from "../../Navbar/Navbar";
import WebLayout from "./webLayout";
import PhnLayout from "./phnLayout";
import Contact from "../../Contact/Contact";

import Media from "react-media";
// Services Data
import LandSurveying from "../LandSurveying";
import Mapping from "../Mapping";
import Inspection from "../Inspection";
import Photography from "../Photography";
import { useNavigate } from "react-router-dom";

import { HashLink as Link } from "react-router-hash-link";

const MainLayout = ({ service }) => {
  const navigate = useNavigate();

  let heading;
  let content;
  let bg;
  let sub_services;
  let sub_services_content;
  let sub_services_images;

  switch (service) {
    case "land_surveying":
      heading = LandSurveying.heading;
      content = LandSurveying.content;
      bg = LandSurveying.bg;
      sub_services = LandSurveying.sub_services;
      sub_services_content = LandSurveying.sub_services_content;
      sub_services_images = LandSurveying.sub_services_images;
      break;
    case "mapping":
      heading = Mapping.heading;
      content = Mapping.content;
      bg = Mapping.bg;
      sub_services = Mapping.sub_services;
      sub_services_content = Mapping.sub_services_content;
      sub_services_images = Mapping.sub_services_images;
      break;
    case "inspection":
      heading = Inspection.heading;
      content = Inspection.content;
      bg = Inspection.bg;
      sub_services = Inspection.sub_services;
      sub_services_content = Inspection.sub_services_content;
      sub_services_images = Inspection.sub_services_images;
      break;
    case "photography":
      heading = Photography.heading;
      content = Photography.content;
      bg = Photography.bg;
      sub_services = Photography.sub_services;
      sub_services_content = Photography.sub_services_content;
      sub_services_images = Photography.sub_services_images;
      break;
    default:
      heading = "Service Not Found";
      content = [];
      bg = "";
      sub_services = [];
      sub_services_content = [];
      sub_services_images = [];
      break;
  }

  const content_box = (content || []).map((contentLine, idx) => {
    return <li key={idx}>{contentLine}</li>;
  });
  const sub_service_box = (sub_services || []).map((sub_service, index) => {
    return (
      <Link to={`#${sub_service}`} key={index}>
        <h4 key={index}>{sub_service}</h4>
      </Link>
    );
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar></Navbar>
      {/* MAIN  */}
      <div className="main">
        <div className="left">
          <div className="main_bg">
            <img src={bg} alt="background image" />
            <div className="layer"></div>
          </div>
          <div className="content">
            <h1>{heading}</h1>
            {content_box}
          </div>
          <div className="btn">
            <h5 onClick={() => navigate("/ContactForm")}>Get a Quote</h5>
          </div>
        </div>
        {/* SUB SERVICES SECTION */}
        <div className="right">{sub_service_box}</div>
      </div>

      <Media query="(max-width: 700px)">
        {(matches) => {
          return matches ? (
            <PhnLayout
              sub_services={sub_services}
              sub_services_content={sub_services_content}
              sub_services_images={sub_services_images}
            />
          ) : (
            <WebLayout
              sub_services={sub_services}
              sub_services_content={sub_services_content}
              sub_services_images={sub_services_images}
            />
          );
        }}
      </Media>
      <Contact />
    </>
  );
};

export default MainLayout;
