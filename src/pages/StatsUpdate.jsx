import React, { useState, useEffect } from "react";
import "../styles/statsupdate.css";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const StatsUpdate = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fetch matches on component mount
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data, error } = await supabase
          .from("matchups")
          .select("match_id, opp_league, date")
          .order("date", { ascending: false });

        if (error) throw error;

        // Filter unique matches
        const uniqueMatches = data.filter((match, index, self) =>
          index === self.findIndex((m) => m.match_id === match.match_id)
        );

        setMatches(uniqueMatches);
      } catch (error) {
        console.error("Error fetching matches:", error.message);
      }
    };

    fetchMatches();
  }, []);

  // Fetch players for the selected match
  const handleMatchSelection = async (matchId) => {
    if (!matchId) return;

    setMessage("Loading players...");
    try {
      const { data: matchData, error } = await supabase
        .from("matchups")
        .select("player_id")
        .eq("match_id", matchId);

      if (error) throw error;

      const playerIds = matchData.map((match) => match.player_id);
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name")
        .in("id", playerIds);

      if (playersError) throw playersError;

      const playerStats = playersData.map((player) => ({
        player_id: player.id,
        PlayerName: player.name,
        score: "",
        fumbles: "",
        defensive_stops: "",
        defensive_score: "",
      }));

      const selected = matches.find((match) => match.match_id === matchId);
      setPlayers(playerStats);
      setSelectedMatch(selected);
      setMessage(`Loaded matchup against ${selected.opp_league}`);
    } catch (error) {
      console.error("Error loading players:", error.message);
      setMessage(`Error loading players: ${error.message}`);
    }
  };

  // Update player stats
  const handleTableChange = (index, field, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index][field] = value;
    setPlayers(updatedPlayers);
  };

  // Save stats
  const handleSave = async () => {
    if (!selectedMatch) {
      setMessage("Please select a match before saving stats.");
      return;
    }

    setMessage("Saving stats...");
    try {
      const rows = players.map((player) => ({
        player_id: player.player_id,
        match_id: selectedMatch.match_id,
        date: selectedMatch.date, // Include the match date
        score: parseInt(player.score, 10) || 0,
        fumbles: parseInt(player.fumbles, 10) || 0,
        defensive_stops: parseInt(player.defensive_stops, 10) || 0,
        defensive_score: parseInt(player.defensive_score, 10) || 0,
      }));

      const { error } = await supabase.from("daily_stats").insert(rows);

      if (error) throw error;

      setMessage("Stats successfully saved!");
    } catch (error) {
      console.error("Error saving stats:", error.message);
      setMessage(`Error saving stats: ${error.message}`);
    }
  };

  return (
    <div className="stats-update">
      <h1>Update Player Stats</h1>
      <div className="match-selection">
        <label htmlFor="matchSelect">Select Match:</label>
        <select
          id="matchSelect"
          onChange={(e) => {
            const matchId = e.target.value;
            const match = matches.find((m) => m.match_id === matchId);
            handleMatchSelection(matchId);
          }}
        >
          <option value="">-- Select Match --</option>
          {matches.map((match) => (
            <option key={match.match_id} value={match.match_id}>
              {match.date} - {match.opp_league}
            </option>
          ))}
        </select>
        <button
          className="upload-button"
          onClick={() => navigate("/statsupdateupload")}
        >
          Upload Stats
        </button>
      </div>

      {selectedMatch && players.length > 0 && (
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Score</th>
                <th>Fumbles</th>
                <th>Defensive Stops</th>
                <th>Defensive Score</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.player_id}>
                  <td>{player.PlayerName}</td>
                  <td>
                    <input
                      type="number"
                      value={player.score}
                      onChange={(e) =>
                        handleTableChange(index, "score", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={player.fumbles}
                      onChange={(e) =>
                        handleTableChange(index, "fumbles", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={player.defensive_stops}
                      onChange={(e) =>
                        handleTableChange(index, "defensive_stops", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={player.defensive_score}
                      onChange={(e) =>
                        handleTableChange(index, "defensive_score", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSave} className="save-stats-button">
            Save Stats
          </button>
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default StatsUpdate;
