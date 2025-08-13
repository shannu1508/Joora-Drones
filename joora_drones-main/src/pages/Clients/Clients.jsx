import React from "react";
import "./Clients.css";

// Images
import AP from "../../assets/clients/AP.webp"
import aptidco from "../../assets/clients/aptidco.webp"
import berryAlloys from "../../assets/clients/berryAlloys.webp"
import ChennaiMetro from "../../assets/clients/ChennaiMetro.webp"
import CII from "../../assets/clients/CII.webp"
import IIM from "../../assets/clients/IIM.webp"
import IRCTC from "../../assets/clients/IRCTC.webp"
import ITDA_Paderu from "../../assets/clients/ITDA-Paderu.webp"
import jspl from "../../assets/clients/jspl.webp"
import KPC from "../../assets/clients/KPC.webp"
import LT from "../../assets/clients/LT.webp"
import MGNREGA from "../../assets/clients/MGNREGA.webp"
import NCC from "../../assets/clients/NCC.webp"
import NTPC from "../../assets/clients/NTPC.webp"
import rvnl from "../../assets/clients/rvnl.webp"
import SP from "../../assets/clients/SP.webp"
import vspl from "../../assets/clients/vspl.webp"
import urc from "../../assets/clients/urc.webp"
import subha from "../../assets/clients/subha.webp"

const Clients = () => {
  return (
    <div id="Clients">
      <h1>Trusted By</h1>
      <div className="scroll_section">
        <div className="logo__container animate">
          <div className="logo__set1">
            <div><img src={AP} alt="AP Government" /></div>
            <div><img src={aptidco} alt="aptidco" /></div>
            <div><img src={berryAlloys} alt="Berry Alloys" /></div>
            <div><img src={ChennaiMetro} alt="Chennai Metro" /></div>
            <div><img className="scale-up" src={CII} alt="CII" /></div>
            <div><img className="scale-up" src={IIM} alt="IIM" /></div>
            <div><img className="scale-up" src={ITDA_Paderu} alt="ITDA_Paderu" /></div>
            <div><img className="scale-up" src={NCC} alt="NCC" /></div>
            <div><img className="scale-up" src={NTPC} alt="NTPC" /></div>
            <div><img src={jspl} alt="jspl" /></div>
            <div><img src={rvnl} alt="rvnl" /></div>
            <div><img src={SP} alt="SP" /></div>
            <div><img src={subha} alt="subha" /></div>
            <div><img src={urc} alt="urc" /></div>
            <div><img src={LT} alt="LT" /></div>
            <div><img src={vspl} alt="vspl" /></div>
            <div><img src={MGNREGA} alt="MGNREGA" /></div>
            <div><img src={IRCTC} alt="IRCTC" /></div>
            <div><img src={KPC} alt="KPC" /></div>
          </div>
          <div className="logo__set2">
            <div><img src={AP} alt="AP Government" /></div>
            <div><img src={aptidco} alt="aptidco" /></div>
            <div><img src={berryAlloys} alt="Berry Alloys" /></div>
            <div><img src={ChennaiMetro} alt="Chennai Metro" /></div>
            <div><img className="scale-up" src={CII} alt="CII" /></div>
            <div><img className="scale-up" src={IIM} alt="IIM" /></div>
            <div><img className="scale-up" src={ITDA_Paderu} alt="ITDA_Paderu" /></div>
            <div><img className="scale-up" src={NCC} alt="NCC" /></div>
            <div><img className="scale-up" src={NTPC} alt="NTPC" /></div>
            <div><img src={jspl} alt="jspl" /></div>
            <div><img src={rvnl} alt="rvnl" /></div>
            <div><img src={SP} alt="SP" /></div>
            <div><img src={subha} alt="subha" /></div>
            <div><img src={urc} alt="urc" /></div>
            <div><img src={LT} alt="LT" /></div>
            <div><img src={vspl} alt="vspl" /></div>
            <div><img src={MGNREGA} alt="MGNREGA" /></div>
            <div><img src={IRCTC} alt="IRCTC" /></div>
            <div><img src={KPC} alt="KPC" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
