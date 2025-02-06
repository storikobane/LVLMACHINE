import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import MatchupUpload from "./pages/MatchupUpload";
import MatchupGen from "./pages/MatchupGen";
import Home from "./pages/Home";
import Lineups from "./pages/Lineups";
import EditLineups from "./pages/EditLineups"; // Added EditLineups
import MatchHistory from "./pages/MatchHistory";
import Matchups from "./pages/Matchups";
import Stats from "./pages/Stats";
import StatsDaily from "./pages/StatsDaily";
import StatsWeekly from "./pages/StatsWeekly";
import StatsDef from "./pages/StatsDef";
import StatsUpdate from "./pages/StatsUpdate";
import StatsUpdateUpload from "./pages/StatsUpdateUpload"; // Import new StatsUpdateUpload page
import ReorderPlayers from "./pages/ReorderPlayers";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error fetching session:", error);
        setUser(data.session ? data.session.user : null);
      } catch (error) {
        console.error("Error during session check:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user : null);
    });

    return () => {
      subscription.subscription?.unsubscribe();
    };
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lineups"
          element={
            <ProtectedRoute>
              <Lineups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editlineups" // New Edit Lineups Route
          element={
            <ProtectedRoute>
              <EditLineups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matchups"
          element={
            <ProtectedRoute>
              <Matchups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matchhistory"
          element={
            <ProtectedRoute>
              <MatchHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <Stats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statsdaily"
          element={
            <ProtectedRoute>
              <StatsDaily />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statsweekly"
          element={
            <ProtectedRoute>
              <StatsWeekly />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statsdef"
          element={
            <ProtectedRoute>
              <StatsDef />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statsupdate"
          element={
            <ProtectedRoute>
              <StatsUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statsupdateupload" // New StatsUpdateUpload Route
          element={
            <ProtectedRoute>
              <StatsUpdateUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reorder"
          element={
            <ProtectedRoute>
              <ReorderPlayers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matchupUpload"
          element={
            <ProtectedRoute>
              <MatchupUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matchupGen"
          element={
            <ProtectedRoute>
              <MatchupGen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
