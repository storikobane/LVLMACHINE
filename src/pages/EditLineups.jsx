import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../styles/editlineups.css";

const EditLineup = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the latest lineup from Supabase on component mount
  useEffect(() => {
    const fetchLatestLineup = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("lineups")
          .select("*")
          .order("created_at", { ascending: false }) // Sort by latest created_at
          .limit(16); // Fetch only the latest lineup of 16 players

        if (error) {
          console.error("Error fetching lineup:", error.message);
          alert("Error loading lineup. Check the console for details.");
        } else if (data.length > 0) {
          setPlayers(data.sort((a, b) => a.lineup_pos - b.lineup_pos)); // Sort by lineup position
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

  const saveLineup = async () => {
    try {
      // Update each player in the Supabase database
      for (const player of players) {
        const { error } = await supabase
          .from("lineups")
          .update({ player_name: player.player_name, off_rating: player.off_rating })
          .eq("lineup_pos", player.lineup_pos);

        if (error) {
          console.error(`Error updating player ${player.lineup_pos}:`, error.message);
          alert(`Error saving lineup for position ${player.lineup_pos}.`);
          return;
        }
      }

      alert("Lineup saved successfully!");
    } catch (err) {
      console.error("Error saving lineup:", err);
      alert("Failed to save lineup. Check the console for details.");
    }
  };

  if (loading) {
    return <div>Loading lineup...</div>;
  }

  if (players.length === 0) {
    return <div>No lineup data available.</div>;
  }

  return (
    <div className="edit-lineup-page">
      <h2>Edit Lineup</h2>
      <div className="player-list">
        {players.map((player, index) => (
          <div className="player-row" key={index}>
            <span>{player.lineup_pos}</span>
            <input
              type="text"
              value={player.player_name}
              onChange={(e) =>
                handlePlayerChange(index, "player_name", e.target.value)
              }
            />
            <input
              type="number"
              value={player.off_rating}
              onChange={(e) =>
                handlePlayerChange(index, "off_rating", parseInt(e.target.value) || 0)
              }
            />
          </div>
        ))}
      </div>
      <button onClick={saveLineup} className="save-button">
        Save Lineup
      </button>
    </div>
  );
};

export default EditLineup;
