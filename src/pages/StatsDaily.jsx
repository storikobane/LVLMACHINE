import React, { useState, useEffect } from "react";
import "../styles/statsdaily.css";
import { supabase } from "../supabaseClient";
import { DatePicker, Space } from "antd";
import "antd/dist/reset.css";

const { RangePicker } = DatePicker;

const StatsDaily = () => {
  const [players, setPlayers] = useState([]); // All players
  const [selectedPlayers, setSelectedPlayers] = useState([]); // Selected players
  const [selectedDates, setSelectedDates] = useState([]); // Selected date range
  const [averages, setAverages] = useState([]); // Averaged stats
  const [message, setMessage] = useState("");

  // Fetch all players on load
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase.from("players").select("id, name");

        if (error) throw error;

        setPlayers(data);
        setSelectedPlayers(data.map((player) => player.id)); // Default to all players
      } catch (error) {
        console.error("Error fetching players:", error.message);
      }
    };

    fetchPlayers();
  }, []);

  // Fetch averages when players or dates change
  useEffect(() => {
    const fetchAverages = async () => {
      if (!selectedDates.length) return;

      setMessage("Loading averages...");
      try {
        const { data, error } = await supabase
          .from("stats")
          .select("player_name, avg(score) as avg_score, avg(ppd) as avg_ppd, avg(advtg) as avg_advtg")
          .in("player_name", selectedPlayers.map((id) => players.find((p) => p.id === id)?.name))
          .gte("date", selectedDates[0]) // Greater than or equal to start date
          .lte("date", selectedDates[selectedDates.length - 1]) // Less than or equal to end date
          .group("player_name"); // Group by player

        if (error) throw error;

        setAverages(data);
        setMessage("");
      } catch (error) {
        console.error("Error fetching averages:", error.message);
        setMessage("Error loading averages.");
      }
    };

    fetchAverages();
  }, [selectedPlayers, selectedDates]);

  // Handle date range selection
  const handleDateChange = (dates) => {
    if (dates) {
      setSelectedDates([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
    } else {
      setSelectedDates([]);
    }
  };

  // Handle player selection
  const handlePlayerChange = (id) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((playerId) => playerId !== id) : [...prev, id]
    );
  };

  // Handle "Select All" toggle
  const toggleSelectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([]); // Deselect all
    } else {
      setSelectedPlayers(players.map((player) => player.id)); // Select all
    }
  };

  return (
    <div className="stats-daily">
      <h1>Daily Stats</h1>

      {/* Date Picker */}
      <Space direction="vertical" size={12} className="date-picker">
        <label>Select Date Range:</label>
        <RangePicker onChange={handleDateChange} />
      </Space>

      {/* Player Selector */}
      <div className="player-selector">
        <label>Select Players:</label>
        <div className="checkbox-group">
          <div>
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedPlayers.length === players.length}
              onChange={toggleSelectAll}
            />
            <label htmlFor="selectAll">Select All</label>
          </div>
          {players.map((player) => (
            <div key={player.id} className="player-checkbox">
              <input
                type="checkbox"
                id={player.id}
                checked={selectedPlayers.includes(player.id)}
                onChange={() => handlePlayerChange(player.id)}
              />
              <label htmlFor={player.id}>{player.name}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Table */}
      <div className="table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Avg Points</th>
              <th>Avg PPD</th>
              <th>Avg ADVTG</th>
            </tr>
          </thead>
          <tbody>
            {averages.map((player) => (
              <tr key={player.player_name}>
                <td>{player.player_name}</td>
                <td>{player.avg_score?.toFixed(2) || "N/A"}</td>
                <td>{player.avg_ppd?.toFixed(2) || "N/A"}</td>
                <td>{player.avg_advtg?.toFixed(2) || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Message */}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default StatsDaily;
