import React from "react";
import "./MainLayout.css";
import ReactCompareImage from "react-compare-image";

import { FiZoomIn, FiZoomOut } from "react-icons/fi";
import { TbZoomReset } from "react-icons/tb";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const PhnLayout = ({
  sub_services,
  sub_services_content,
  sub_services_images,
}) => {
  const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
    <div className="controls">
      <button onClick={() => zoomIn()}>
        <FiZoomIn />
      </button>
      <button onClick={() => zoomOut()}>
        <FiZoomOut />
      </button>
      <button onClick={() => resetTransform()}>
        <TbZoomReset />
      </button>
    </div>
  );

  const sub_service_section = sub_services.map((sub_service, index) => {
    const imgComponent = () => {
      if (sub_service == "Boundary Surveying") {
        return (
          <TransformWrapper>
            {(utils) => (
              <React.Fragment>
                <TransformComponent>
                  <img
                    src={sub_services_images[index]}
                    alt={sub_service}
                    width="400px"
                    style={{objectFit: "contain"}}
                  />
                </TransformComponent>
                <Controls {...utils} />
              </React.Fragment>
            )}
          </TransformWrapper>
        );
      } else if (
        sub_service == "Contour Surveying" ||
        sub_service == "Volumetric Analysis" ||
        sub_service == "Urban Planning"
      ) {
        return (
          <TransformWrapper>
            {(utils) => (
              <React.Fragment>
                <TransformComponent>
                  <img
                    src={sub_services_images[index]}
                    alt={sub_service}
                    width="400px"
                  />
                </TransformComponent>
                {sub_service != "Volumetric Analysis" ? (
                  <Controls {...utils} />
                ) : (
                  <></>
                )}
              </React.Fragment>
            )}
          </TransformWrapper>
        );
      }  else if (sub_service == "Digital Twinning") {
        return (
          <model-viewer
          src="auhub.glb"
          auto-rotate
          camera-controls
          shadow-intensity="0.8"
          exposure="2"
          shadow-softness="0.38"
          camera-orbit="1.204deg 157.5deg 187.6m"
          field-of-view="18.1deg"
        >
        </model-viewer>
        );
      } else if (sub_service == "Progressive Photography") {
        return (
            <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/biFfJw2k_7I?rel=0"
            title="Progressive Photography"
            frameborder="0"
            allow="autoplay; encrypted-media;"
            allowfullscreen
          ></iframe>
        );
      }else if (sub_service == "Telemetry Videography") {
        return (
            <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/StcwYGe9gnY?rel=0"
            title="Telemetry Videography"
            frameborder="0"
            allow="autoplay; encrypted-media;"
            allowfullscreen
          ></iframe>
        );
      } else {
        return (
          <img
            src={sub_services_images[index]}
            alt={sub_service}
            width="400px"
          />
        );
      }
    };
    return (
      <div className="sub_service_modal" id={sub_service}>
        <div className="left">
          <div className="content">
            <h1>{sub_service}</h1>
            <p>{sub_services_content[index].map((item)=>{
                return <li>{item}</li>
            })}</p>
          </div>
        </div>
        {sub_service == "Digital Twinning" ? (
          <div className=" right threeD ">{imgComponent()}</div>
        ) : (
          <div className="right">{imgComponent()}</div>
        )}
      </div>
    );
  });

  return <div>{sub_service_section}</div>;
};

export default PhnLayout;
