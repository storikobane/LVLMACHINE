import React, { useState, useEffect } from 'react';
import "../styles/stats.css";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Adjust the import path based on your project structure

const Stats = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState([]);
    const [summary, setSummary] = useState({ totalPoints: 0, avgPPD: 0, avgAdvantage: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch daily stats from Supabase
                const { data: dailyStats, error: dailyError } = await supabase
                    .from('daily_stats')
                    .select('player_name, score, advtg, ppd');

                if (dailyError) throw dailyError;

                // Group and process stats for display
                const processedStats = dailyStats.reduce((acc, curr) => {
                    const player = acc.find(p => p.name === curr.player_name);

                    if (!player) {
                        acc.push({
                            name: curr.player_name,
                            dailyScores: [curr.score],
                            weeklyPPD: curr.ppd,
                            weeklyPoints: curr.score,
                            advantage: curr.advtg,
                        });
                    } else {
                        player.dailyScores.push(curr.score);
                        player.weeklyPoints += curr.score;
                        player.weeklyPPD = (player.weeklyPPD + curr.ppd) / 2;
                        player.advantage += curr.advtg;
                    }

                    return acc;
                }, []);

                setStats(processedStats);

                // Calculate summary data
                const totalPoints = processedStats.reduce((sum, player) => sum + player.weeklyPoints, 0);
                const avgPPD = (processedStats.reduce((sum, player) => sum + player.weeklyPPD, 0) / processedStats.length).toFixed(2);
                const avgAdvantage = (processedStats.reduce((sum, player) => sum + player.advantage, 0) / processedStats.length).toFixed(2);

                setSummary({ totalPoints, avgPPD, avgAdvantage });

            } catch (error) {
                console.error('Error fetching stats:', error.message);
            }
        };

        fetchStats();
    }, []);

    const handleSort = (key) => {
        const sortedStats = [...stats].sort((a, b) => b[key] - a[key]);
        setStats(sortedStats);
    };

    return (
        <div className="stats-main">
            <div className="stats-navigation">
                <button onClick={() => navigate("/StatsDaily")}>Daily Stats</button>
                <button onClick={() => navigate("/StatsWeekly")}>Weekly Stats</button>
                <button onClick={() => navigate("/StatsDef")}>Defensive Stats</button>
                <button onClick={() => navigate("/StatsUpdate")}>Update Stats</button>
            </div>

            <div className="stats-summary">
                <p>Total Team Points: {summary.totalPoints}</p>
                <p>Average PPD: {summary.avgPPD}</p>
                <p>Average Advantage: {summary.avgAdvantage}</p>
            </div>

            <div className="stats-table-container">
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th>Player Name</th>
                            {[...Array(7)].map((_, i) => (
                                <th key={i}>Day {i + 1}</th>
                            ))}
                            <th onClick={() => handleSort("weeklyPPD")}>Weekly PPD</th>
                            <th onClick={() => handleSort("weeklyPoints")}>Weekly Points</th>
                            <th onClick={() => handleSort("advantage")}>Advantage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((player, index) => (
                            <tr key={index}>
                                <td>{player.name}</td>
                                {player.dailyScores.map((score, i) => (
                                    <td key={i}>{score}</td>
                                ))}
                                <td>{player.weeklyPPD.toFixed(2)}</td>
                                <td>{player.weeklyPoints}</td>
                                <td>{player.advantage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Stats;
