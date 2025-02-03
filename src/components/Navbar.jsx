import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ListOrdered, Handshake, ChartScatter, CalendarClock, User } from "lucide-react";
import "../styles/navbar.css";

const Navbar = () => {
  const location = useLocation();

  // Hide Navbar on the Login page
  if (location.pathname === "/login") {
    return null;
  }

  return (
    <nav className="navbar">
      <ul className="nav-links">
        <li className={location.pathname === "/" ? "active" : ""}>
          <Link to="/">
            <Home className="nav-icon" />
            <span className="nav-label">Home</span>
          </Link>
        </li>
        <li className={location.pathname === "/lineups" ? "active" : ""}>
          <Link to="/lineups">
            <ListOrdered className="nav-icon" />
            <span className="nav-label">Lineups</span>
          </Link>
        </li>
        <li className={location.pathname === "/matchups" ? "active" : ""}>
          <Link to="/matchups">
            <Handshake className="nav-icon" />
            <span className="nav-label">Matchups</span>
          </Link>
        </li>
        <li className={location.pathname === "/matchhistory" ? "active" : ""}>
          <Link to="/matchhistory">
            <CalendarClock className="nav-icon" />
            <span className="nav-label">History</span>
          </Link>
        </li>
        <li className={location.pathname === "/stats" ? "active" : ""}>
          <Link to="/stats">
            <ChartScatter className="nav-icon" />
            <span className="nav-label">Stats</span>
          </Link>
        </li>
        <li className={location.pathname === "/profile" ? "active" : ""}>
          <Link to="/profile">
            <User className="nav-icon" />
            <span className="nav-label">Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;