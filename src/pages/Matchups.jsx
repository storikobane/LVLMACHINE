import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Use your existing Supabase client
import "../styles/matchups.css";
import { useNavigate } from "react-router-dom";

const Matchups = () => {
  const [matchups, setMatchups] = useState([]);
  const [leagueInfo, setLeagueInfo] = useState({ opp_league: "", date: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch today's matchups
  useEffect(() => {
    const fetchMatchups = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]; // Format date as YYYY-MM-DD
        const { data, error } = await supabase
          .from("matchups")
          .select("*")
          .eq("date", today);

        if (error) {
          console.error("Error fetching matchups:", error);
          return;
        }

        if (data && data.length > 0) {
          setMatchups(data);
          setLeagueInfo({
            opp_league: data[0].opp_league || "Unknown League",
            date: data[0].date || "Unknown Date",
          });
        } else {
          setLeagueInfo({
            opp_league: "No League Data",
            date: today,
          });
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchups();
  }, []);

  const navigateToUpload = () => {
    navigate("/matchupUpload");
  };

  return (
    <div className="matchup-gen-page">
      {/* Navbar-aligned upload button */}
      <div className="button-container">
        <button className="upload-button" onClick={navigateToUpload}>
          Upload Matchups
        </button>
      </div>

      {/* League and Date Information */}
      <div className="league-info">
        <h1>{leagueInfo.opp_league}</h1>
        <p>Today's Matchup: {new Date(leagueInfo.date).toLocaleDateString()}</p>
      </div>

      <div className="table-container">
        {loading ? (
          <p>Loading...</p>
        ) : matchups.length > 0 ? (
          <table className="matchup-table">
            <thead>
              <tr>
                <th>Opponent</th>
                <th>Def.</th>
                <th>Player</th>
                <th>Off.</th>
                <th>Advtg</th>
                <th>PPD</th>
              </tr>
            </thead>
            <tbody>
              {matchups.map((matchup, index) => (
                <tr key={index}>
                  <td>{matchup.opponent_name || "N/A"}</td>
                  <td>{matchup.defensive_rating || "N/A"}</td>
                  <td>{matchup.player_name || "N/A"}</td>
                  <td>{matchup.off_rating || "N/A"}</td>
                  <td
                    style={{
                      color: matchup.advantage > 0 ? "green" : "red",
                      fontWeight: "bold",
                      backgroundColor:
                        matchup.advantage > 0
                          ? `rgba(0, 255, 0, ${Math.min(
                              1,
                              matchup.advantage / 100
                            )})`
                          : `rgba(255, 0, 0, ${Math.min(
                              1,
                              Math.abs(matchup.advantage) / 100
                            )})`,
                    }}
                  >
                    {matchup.advantage > 0
                      ? `+${matchup.advantage}`
                      : matchup.advantage}
                  </td>
                  <td>{matchup.ppd || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No matchups found for today.</p>
        )}
      </div>
    </div>
  );
};

export default Matchups;
