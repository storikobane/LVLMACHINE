import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import Supabase client
import '../styles/reorderplayers.css';

function ReorderPlayers() {
  const location = useLocation();
  const navigate = useNavigate();
  const [players, setPlayers] = useState(location.state?.players || []);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (index) => {
    const updatedPlayers = [...players];
    const [draggedPlayer] = updatedPlayers.splice(draggedIndex, 1);
    updatedPlayers.splice(index, 0, draggedPlayer);
    setPlayers(updatedPlayers);
    setDraggedIndex(null);
  };

  const saveReorderedPlayers = async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

      // Prepare data for insertion
      const dataToInsert = players.map((player, index) => ({
        date: currentDate,
        player_name: player.player_name || 'No Name',
        off_rating: player.off_rating || 0,
        lineup_pos: index + 1,
      }));

      // Insert data into the `lineups` table
      const { error } = await supabase.from('lineups').insert(dataToInsert);

      if (error) throw error;

      alert('Lineup saved successfully!');
      console.log('Reordered Players Saved:', dataToInsert);

      navigate('/'); // Navigate back to the home page or another route
    } catch (error) {
      console.error('Error saving lineup:', error.message);
      alert('Failed to save lineup. Please try again.');
    }
  };

  return (
    <div className="reorder-page">
      <h2>Reorder Players</h2>
      <ul className="player-list">
        {players.map((player, index) => (
          <li
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            className="player-row"
          >
            <div className="player-position">{index + 1}</div>
            <div className="player-name">{player.player_name || 'No Name'}</div>
            <div className="player-rating">{player.off_rating || 0}</div>
          </li>
        ))}
      </ul>
      <button className="save-button" onClick={saveReorderedPlayers}>
        Save Lineup
      </button>
    </div>
  );
}

export default ReorderPlayers;
