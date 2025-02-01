import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/matchupGen.css";

const MatchupGen = () => {
  const [opponents, setOpponents] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [leagueInfo, setLeagueInfo] = useState({ leagueName: "", leagueTier: "" });

  useEffect(() => {
    const fetchOpponents = async () => {
      const { data, error } = await supabase
        .from("opponents")
        .select("opponent_name, defensive_rating, rank, league_name, league_tier")
        .order("created_at", { ascending: false })
        .limit(16);

      if (error) {
        console.error("Error fetching opponents:", error);
        return;
      }

      if (data.length > 0) {
        setOpponents(
          data.sort((a, b) => a.rank - b.rank).map(({ opponent_name, defensive_rating, rank }) => ({
            opponent_name,
            defensive_rating,
            rank,
          }))
        );
        setLeagueInfo({ leagueName: data[0].league_name, leagueTier: data[0].league_tier });
      }
    };

    const fetchLineups = async () => {
      const { data, error } = await supabase
        .from("lineups")
        .select("player_name, off_rating, lineup_pos")
        .order("date", { ascending: false })
        .limit(16);

      if (error) {
        console.error("Error fetching lineups:", error);
        return;
      }

      if (data.length > 0) {
        setLineups(data.sort((a, b) => a.lineup_pos - b.lineup_pos));
      }
    };

    fetchOpponents();
    fetchLineups();
  }, []);

  const calculateAdvantage = (offRating, defRating) => offRating - defRating;

  const handleSaveMatchup = async () => {
    try {
      // Insert a new record into the matches table
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert({
          date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
          opponent: leagueInfo.leagueName,
          our_score: 0, // Placeholder value
          their_score: 0, // Placeholder value
          result: "N/A", // Placeholder value
          day: new Date().toLocaleString("en-US", { weekday: "long" }), // Get current day name
        })
        .select("id")
        .single(); // Get the generated match_id

      if (matchError) {
        console.error("Error creating match record:", matchError);
        alert("Failed to create a match record.");
        return;
      }

      const match_id = matchData.id;

      // Match lineups and opponents based on lineup_pos and rank
      const matchups = opponents.map((opponent) => {
        const player = lineups.find((lineup) => lineup.lineup_pos === opponent.rank) || {
          player_name: "N/A",
          off_rating: 0,
          player_id: null,
        };
        const advantage = calculateAdvantage(player.off_rating, opponent.defensive_rating);

        return {
          match_id, // Use the generated match_id
          player_id: player.player_id || null,
          date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
          opponent_name: opponent.opponent_name,
          defensive_rating: opponent.defensive_rating,
          opp_league: leagueInfo.leagueName,
          leaguetier: leagueInfo.leagueTier,
          player_name: player.player_name,
          off_rating: player.off_rating,
          advantage,
          ppd: null, // Placeholder for Points Per Drive
        };
      });

      // Insert matchups into the matchups table
      const { error: matchupError } = await supabase.from("matchups").insert(matchups);

      if (matchupError) {
        console.error("Error saving matchups:", matchupError);
        alert("Failed to save matchups.");
        return;
      }

      alert("Match and matchups saved successfully!");
    } catch (error) {
      console.error("Error during saving matchups:", error);
      alert("An error occurred while saving the match and matchups.");
    }
  };

  return (
    <div className="matchup-gen-page">
      <div className="league-info">
        <h1>{leagueInfo.leagueName || "Unknown League"}</h1>
        <p>{leagueInfo.leagueTier || "Unknown Tier"}</p>
      </div>

      <div className="table-container">
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
            {opponents.map((opponent, index) => {
              const player =
                lineups.find((lineup) => lineup.lineup_pos === opponent.rank) || {
                  player_name: "N/A",
                  off_rating: 0,
                };
              const advantage = calculateAdvantage(player.off_rating, opponent.defensive_rating);

              return (
                <tr key={index}>
                  <td>{opponent.opponent_name}</td>
                  <td>{opponent.defensive_rating}</td>
                  <td>{player.player_name}</td>
                  <td>{player.off_rating}</td>
                  <td
                    style={{
                      color: advantage > 0 ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {advantage > 0 ? `+${advantage}` : advantage}
                  </td>
                  <td>N/A</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button className="generate-button" onClick={handleSaveMatchup}>
        Save Matchup
      </button>
    </div>
  );
};

export default MatchupGen;
