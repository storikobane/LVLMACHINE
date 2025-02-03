import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../styles/stats.css";

const Stats = () => {
    const [teamSummary, setTeamSummary] = useState({
        avgPPD: 0,
    });
    const [recentMatches, setRecentMatches] = useState([]);

    useEffect(() => {
        const fetchTeamStats = async () => {
            try {
                const { data: matches, error } = await supabase
                    .from("matches")
                    .select("opponent, our_score, their_score, date")
                    .order("date", { ascending: false })
                    .limit(5); // Limit to last 5 matches

                if (error) throw error;

                if (!matches || matches.length === 0) {
                    setTeamSummary({ avgPPD: 0 });
                    setRecentMatches([]);
                    return;
                }

                // Filter out matches without scores
                const validMatches = matches.filter(
                    (match) => match.our_score !== null && match.our_score > 0
                );

                if (validMatches.length === 0) {
                    setTeamSummary({ avgPPD: 0 });
                    setRecentMatches([]);
                    return;
                }

                // Calculate total points and average PPD
                const totalPoints = validMatches.reduce((sum, match) => sum + match.our_score, 0);
                const avgPPD = (totalPoints / (validMatches.length * 48)).toFixed(2);

                setTeamSummary({ avgPPD });
                setRecentMatches(validMatches);
            } catch (error) {
                console.error("Error fetching team stats:", error);
            }
        };

        fetchTeamStats();
    }, []);

    return (
        <div className="stats-homepage">
            {/* Navigation Buttons */}
            <div className="navigation-buttons">
                <button onClick={() => (window.location.href = "/statsdaily")}>Daily Stats</button>
                <button onClick={() => (window.location.href = "/statsweekly")}>Weekly Stats</button>
                <button onClick={() => (window.location.href = "/statsdef")}>Defensive Stats</button>
                <button onClick={() => (window.location.href = "/statsupdate")}>Update Stats</button>
            </div>

            {/* Team Summary Section */}
            <div className="team-summary">
                <h2>Average PPD: {teamSummary.avgPPD}</h2>
            </div>

            {/* Recent Matches Section */}
            <div className="recent-matches">
                <h2>Recent Matches</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Opponent</th>
                            <th>Our Score</th>
                            <th>Their Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentMatches.map((match, index) => (
                            <tr key={index}>
                                <td>{new Date(match.date).toLocaleDateString()}</td>
                                <td>{match.opponent || "N/A"}</td>
                                <td>{match.our_score || "N/A"}</td>
                                <td>{match.their_score || "N/A"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Stats;
