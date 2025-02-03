import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Bar, Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import "../styles/stats.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Stats = () => {
    const [teamSummary, setTeamSummary] = useState({
        totalPoints: 0,
        avgPPD: 0,
    });
    const [recentMatches, setRecentMatches] = useState([]);
    const [topPlayers, setTopPlayers] = useState([]);
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [pieData, setPieData] = useState({ labels: [], datasets: [] });

    useEffect(() => {
        // Fetch team stats from `matches` table
        const fetchTeamStats = async () => {
            try {
                const { data: matches, error } = await supabase
                    .from("matches")
                    .select("our_score, opp_score, date")
                    .order("date", { ascending: false });

                if (error) throw error;

                if (!matches || matches.length === 0) {
                    setTeamSummary({ totalPoints: 0, avgPPD: 0 });
                    setRecentMatches([]);
                    return;
                }

                const totalPoints = matches.reduce((sum, match) => sum + match.our_score, 0);
                const avgPPD = (totalPoints / (matches.length * 48)).toFixed(2);

                setTeamSummary({ totalPoints, avgPPD });
                setRecentMatches(matches);
            } catch (error) {
                console.error("Error fetching team stats:", error);
            }
        };

        // Fetch top players from `stats` table
        const fetchTopPlayers = async () => {
            try {
                const { data, error } = await supabase
                    .from("stats")
                    .select("player_name, score, ppd, advtg")
                    .order("ppd", { ascending: false })
                    .limit(5);

                if (error) throw error;

                setTopPlayers(data);
            } catch (error) {
                console.error("Error fetching top players:", error);
            }
        };

        // Fetch chart data from `stats` table
        const fetchChartData = async () => {
            try {
                const { data, error } = await supabase
                    .from("stats")
                    .select("player_name, score, ppd");

                if (error) throw error;

                const labels = data.map((stat) => stat.player_name);
                const scores = data.map((stat) => stat.score);

                setPieData({
                    labels,
                    datasets: [
                        {
                            data: scores,
                            backgroundColor: [
                                "#00e0ff",
                                "#98FB98",
                                "#ADD8E6",
                                "#D3D3D3",
                                "#36454F",
                            ],
                        },
                    ],
                });

                const ppds = data.map((stat) => stat.ppd);
                setChartData({
                    labels,
                    datasets: [
                        {
                            label: "PPD",
                            data: ppds,
                            backgroundColor: "#ADD8E6",
                        },
                    ],
                });
            } catch (error) {
                console.error("Error fetching chart data:", error);
            }
        };

        fetchTeamStats();
        fetchTopPlayers();
        fetchChartData();
    }, []);

    return (
        <div className="stats-homepage">
            <h1>Stats Hub</h1>

            {/* Navigation Buttons */}
            <div className="navigation-buttons">
                <button onClick={() => (window.location.href = "/statsdaily")}>Daily Stats</button>
                <button onClick={() => (window.location.href = "/statsweekly")}>Weekly Stats</button>
                <button onClick={() => (window.location.href = "/statsdef")}>Defensive Stats</button>
                <button onClick={() => (window.location.href = "/statsupdate")}>Update Stats</button>
            </div>

            {/* Team Summary */}
            <div className="team-summary">
                <h2>Team Summary</h2>
                <div>Total Points: {teamSummary.totalPoints}</div>
                <div>Average PPD: {teamSummary.avgPPD}</div>
            </div>

            {/* Top Players */}
            <div className="top-players">
                <h2>Top 5 Players</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Player Name</th>
                            <th>PPD</th>
                            <th>Points</th>
                            <th>ADVTG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(topPlayers || []).map((player) => (
                            <tr key={player.player_name}>
                                <td>{player.player_name || "N/A"}</td>
                                <td>{player.ppd || "N/A"}</td>
                                <td>{player.score || "N/A"}</td>
                                <td>{player.advtg || "N/A"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recent Matches */}
            <div className="recent-matches">
                <h2>Recent Matches</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Our Score</th>
                            <th>Their Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentMatches.map((match, index) => (
                            <tr key={index}>
                                <td>{new Date(match.date).toLocaleDateString()}</td>
                                <td>{match.our_score}</td>
                                <td>{match.opp_score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Charts */}
            <div className="charts">
                <h2>Team PPD Trend</h2>
                <Bar data={chartData} />

                <h2>Player Point Distribution</h2>
                <Pie data={pieData} />
            </div>
        </div>
    );
};

export default Stats;
