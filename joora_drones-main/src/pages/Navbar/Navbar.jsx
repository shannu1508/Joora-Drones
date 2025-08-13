import { useState, useRef, React } from "react";
import "./Navbar.css";
import Logo from "../../assets/logo.webp";
import { FaBars, FaTimes } from "react-icons/fa";
import { HashLink as Link } from "react-router-hash-link";

const Navbar = () => {
  const navRef = useRef();
  const [isOpen, setIsOpen] = useState(true);

  const showNavBar = () => {
    setIsOpen((prevState) => {
      return !prevState;
    });
    navRef.current.classList.toggle("responsive_nav");
  };

  const links = [
    { name: "Home", to: "/#Home" },
    { name: "About", to: "/#About" },
    { name: "Services", to: "/#Services" },
    { name: "ShpToKml", to: "/shptokml" }, // <-- changed here
    { name: "Contact", to: "/#Contact" }
  ].map((item, index) => (
    <Link
      onClick={showNavBar}
      className="link link--metis"
      to={item.to}
      key={index}
    >
      {item.name}
    </Link>
  ));

  return (
    <div className="navbar">
      <div className="logo__section">
        <img src={Logo} alt="Joora Drones Logo" />
        <h3>
          <Link to={`/`}>Joora Drones</Link>
        </h3>
      </div>

      <div className="links__section" ref={navRef}>
        {links}
      </div>

      {/* Menu Button  | This is used when screen width <= Tablet*/}
      <button className="nav-btn nav-close-btn" onClick={showNavBar}>
        {isOpen ? <FaBars /> : <FaTimes />}
      </button>
    </div>
  );
};

export default Navbar;
