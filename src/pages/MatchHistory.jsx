import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/matchhistory.css';

function MatchHistory() {
  const [matchHistory, setMatchHistory] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [leagueTiers, setLeagueTiers] = useState(['All']); // Default to include "All"
  const [selectedTier, setSelectedTier] = useState('All');
  const [totalRecord, setTotalRecord] = useState({ wins: 0, losses: 0, ties: 0 });

  useEffect(() => {
    const fetchMatches = async () => {
      // Fetch match data
      const { data } = await supabase.from('matches').select('*').order('date', { ascending: false });

      // Calculate total record
      if (data) {
        const wins = data.filter((match) => match.our_score > match.their_score).length;
        const losses = data.filter((match) => match.our_score < match.their_score).length;
        const ties = data.filter((match) => match.our_score === match.their_score).length;
        setTotalRecord({ wins, losses, ties });
      }

      // Fetch distinct league tiers
      const { data: tiers } = await supabase
        .from('matches')
        .select('league_tier')
        .neq('league_tier', null); // Exclude null values

      // Update match history, filtered matches, and league tiers
      setMatchHistory(data || []);
      setFilteredMatches(data || []);
      if (tiers) {
        const uniqueTiers = ['All', ...new Set(tiers.map((item) => item.league_tier))];
        setLeagueTiers(uniqueTiers);
      }
    };
    fetchMatches();
  }, []);

  const handleTierChange = (tier) => {
    setSelectedTier(tier);
    if (tier === 'All') {
      setFilteredMatches(matchHistory);
    } else {
      const filtered = matchHistory.filter((match) => match.league_tier === tier);
      setFilteredMatches(filtered);
    }
  };

  const getMatchResultClass = (ourScore, theirScore) => {
    if (ourScore > theirScore) return 'win';
    if (ourScore < theirScore) return 'loss';
    return 'tie';
  };

  return (
    <div className="match-history">
      <h2>Match History</h2>

      {/* Total Record */}
      <div className="total-record">
        {totalRecord.wins}-{totalRecord.losses}-{totalRecord.ties}
      </div>

      {/* Tier Filter */}
      <div className="tier-filter">
        {leagueTiers.map((tier) => (
          <button
            key={tier}
            className={`filter-button ${selectedTier === tier ? 'active' : ''}`}
            onClick={() => handleTierChange(tier)}
          >
            {tier}
          </button>
        ))}
      </div>

      {/* Match Cards */}
      <div className="match-cards-container">
        {filteredMatches.map((match) => (
          <div
            key={match.id}
            className={`match-card ${getMatchResultClass(match.our_score, match.their_score)}`}
          >
            <p className="match-date">{new Date(match.date).toLocaleDateString()}</p>
            <p className="match-opponent">{match.opponent}</p>
            <p className="match-score">
              {match.our_score} - {match.their_score}
            </p>
            <p className="match-tier">{match.league_tier}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchHistory;
