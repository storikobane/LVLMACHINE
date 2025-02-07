import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/matchhistory.css";

const MatchHistory = () => {
  const [matchHistory, setMatchHistory] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [leagueTiers, setLeagueTiers] = useState(["All"]);
  const [totalRecord, setTotalRecord] = useState({ wins: 0, losses: 0, ties: 0 });
  const [selectedTier, setSelectedTier] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .order("date", { ascending: false });

        if (error) {
          console.error("Error fetching matches:", error);
          setLoading(false);
          return;
        }

        if (data) {
          setMatchHistory(data);
          setFilteredMatches(data);

          // Calculate total record
          const wins = data.filter((match) => match.our_score > match.their_score).length;
          const losses = data.filter((match) => match.our_score < match.their_score).length;
          const ties = data.filter((match) => match.our_score === match.their_score).length;
          setTotalRecord({ wins, losses, ties });

          // Extract unique league tiers
          const uniqueTiers = ["All", ...new Set(data.map((match) => match.league_tier).filter(Boolean))];
          setLeagueTiers(uniqueTiers);
        }
      } catch (error) {
        console.error("Error fetching match history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const filterMatchesByTier = (tier) => {
    setSelectedTier(tier);
    if (tier === "All") {
      setFilteredMatches(matchHistory);
    } else {
      setFilteredMatches(matchHistory.filter((match) => match.league_tier === tier));
    }
  };

  const getMatchResultClass = (ourScore, theirScore) => {
    if (ourScore > theirScore) return "win";
    if (ourScore < theirScore) return "loss";
    return "tie";
  };

  if (loading) {
    return <div className="match-history-page">Loading match history...</div>;
  }

  if (!matchHistory.length) {
    return <div className="match-history-page">No match history available.</div>;
  }

  return (
    <div className="match-history-page">
      <h2>Match History</h2>
      <div className="total-record">
        <p>
          <strong>Total Record:</strong> {totalRecord.wins} Wins, {totalRecord.losses} Losses, {totalRecord.ties} Ties
        </p>
      </div>
      <div className="tier-filter">
        {leagueTiers.map((tier) => (
          <button
            key={tier}
            className={`filter-button ${selectedTier === tier ? "active" : ""}`}
            onClick={() => filterMatchesByTier(tier)}
          >
            {tier}
          </button>
        ))}
      </div>
      <div className="match-cards-container">
        {filteredMatches.map((match) => (
          <div
            key={match.id}
            className={`match-card ${getMatchResultClass(match.our_score, match.their_score)}`}
          >
            <p className="match-date">{new Date(match.date).toLocaleDateString()}</p>
            <p className="match-opponent">{match.opponent}</p>
            <p className="match-score">{match.our_score} - {match.their_score}</p>
            <p className="match-tier">{match.league_tier}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchHistory;
