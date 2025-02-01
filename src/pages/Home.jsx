import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../styles/home.css";

function Home() {
  const [matchups, setMatchups] = useState([]);
  const [leagueInfo, setLeagueInfo] = useState({ opp_league: "", date: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysMatchups = async () => {
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

    fetchTodaysMatchups();
  }, []);

  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h2>Welcome to the LVL Machine</h2>
      </div>

      {/* League and Date Information */}
      <div className="league-info">
        <h3>{leagueInfo.opp_league}</h3>
        <p>Today's Matchup: {new Date(leagueInfo.date).toLocaleDateString()}</p>
      </div>

      <div className="table-container">
        {matchups.length > 0 ? (
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
                          ? `rgba(0, 255, 0, ${Math.min(1, matchup.advantage / 100)})`
                          : `rgba(255, 0, 0, ${Math.min(1, Math.abs(matchup.advantage) / 100)})`,
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
}

export default Home;
