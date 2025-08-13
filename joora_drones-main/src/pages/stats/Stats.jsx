import React from "react";
import "./Stats.css";
import zigzag from "../../assets/abstract/topography.svg";

const Stats = () => {
  const info = [
    {
      title: "10x",
      content: "Faster",
    },
    {
      title: "99%",
      content: "Efficient",
    },
    {
      title: "100%",
      content: "Safe",
    },
    {
      title: "170+",
      content: "Projects",
    },
    {
      title: "50+",
      content: "Clients",
    },
  ];
  const info_box = info.map((stat) => {
    return (
      <div>
        <h1>{stat.title}</h1>
        <h2>{stat.content}</h2>
      </div>
    );
  });

  return (
    <div className="stats">
      <div className="info">
        <img src={zigzag} alt="background" />
        {info_box}
      </div>
    </div>
  );
};

export default Stats;
