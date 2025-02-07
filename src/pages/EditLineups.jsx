import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../styles/editlineups.css";

const EditLineup = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch the latest lineup from Supabase on component mount
  useEffect(() => {
    const fetchLatestLineup = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("lineups")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(16);

        if (error) {
          console.error("Error fetching lineup:", error.message);
          alert("Error loading lineup. Check the console for details.");
        } else if (data.length > 0) {
          setPlayers(data.sort((a, b) => a.lineup_pos - b.lineup_pos));
        } else {
          alert("No lineup data available.");
        }
      } catch (err) {
        console.error("Error fetching lineup:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestLineup();
  }, []);

  const handlePlayerChange = (index, field, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index][field] = value;
    setPlayers(updatedPlayers);
  };

  const handleContinue = () => {
    navigate("/reorder", { state: { players } }); // Pass the players state
  };

  if (loading) {
    return <div>Loading lineup...</div>;
  }

  if (players.length === 0) {
    return <div>No lineup data available.</div>;
  }

  return (
    <div className="editlineuppage">
      <h2>Edit Lineup</h2>
      <div className="player-list">
        {players.map((player, index) => (
          <div className="player-row" key={index}>
            <span>{player.lineup_pos}</span>
            <input
              type="text"
              className="name-input"
              value={player.player_name}
              onChange={(e) =>
                handlePlayerChange(index, "player_name", e.target.value)
              }
            />
            <input
              type="number"
              className="rating-input"
              value={player.off_rating}
              onChange={(e) =>
                handlePlayerChange(index, "off_rating", parseInt(e.target.value) || 0)
              }
            />
          </div>
        ))}
      </div>
      <div className="save-button-container">
        <button onClick={handleContinue} className="save-button">
          Continue...
        </button>
      </div>
    </div>
  );
};

export default EditLineup;
