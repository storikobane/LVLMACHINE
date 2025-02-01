import React, { useState, useEffect } from 'react';
import "../styles/statsupdate.css";
import { supabase } from '../supabaseClient';
import axios from 'axios';

const StatsUpdate = () => {
    const [tableData, setTableData] = useState([]);
    const [message, setMessage] = useState("");
    const [images, setImages] = useState([]);

    const blobStorageUrl = "https://statsimages.blob.core.windows.net/stats";
    const sasToken = "sp=racwdli&st=2025-01-30T23:04:30Z&se=2025-02-28T07:04:30Z&sv=2022-11-02&sr=c&sig=R5mK4FB8mgqXnMSphPol2v7ay3%2BrqI8GXXiXU2VihlQ%3D";
    const azureEndpoint = "https://matchupsreader.cognitiveservices.azure.com/";
    const azureKey = "87HP219ViBXwWNC6G9hYqDA4Ec2SiJf1YJ0K9InroAVpRxS4dw65JQQJ99BAACYeBjFXJ3w3AAALACOG4skb";

    useEffect(() => {
        const fetchMatchup = async () => {
            setMessage("Loading the latest matchup...");

            try {
                const { data: matchups, error: matchupError } = await supabase
                    .from("matchups")
                    .select("match_id, opp_league, created_at")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (matchupError) throw matchupError;
                if (!matchups) {
                    setMessage("No matchup data found.");
                    return;
                }

                const { match_id, opp_league } = matchups;

                const { data: playersData, error: playersError } = await supabase
                    .from("matchups")
                    .select("player_id, players(name)")
                    .eq("match_id", match_id);

                if (playersError) throw playersError;

                const predefinedOrder = [
                    "StoriKobane",
                    "SuperJett",
                    "SuperChip",
                    "Smileybchezzta",
                    "Forgot-to-Wipe",
                    "Quarterbubble",
                    "Noliaclap504",
                    "STBmazzy",
                    "PipeLayer69",
                    "TexanJoe84",
                    "TheBronze",
                    "Prince",
                    "KobaneKrazy",
                    "Chief"
                ];

                const matchingPlayers = [];
                const remainingPlayers = [];

                playersData.forEach(player => {
                    if (predefinedOrder.includes(player.players.name)) {
                        matchingPlayers.push(player);
                    } else {
                        remainingPlayers.push(player);
                    }
                });

                matchingPlayers.sort((a, b) => predefinedOrder.indexOf(a.players.name) - predefinedOrder.indexOf(b.players.name));
                const shuffledRemaining = remainingPlayers.sort(() => Math.random() - 0.5);
                const sortedPlayersData = [...matchingPlayers, ...shuffledRemaining];

                const tableData = sortedPlayersData.map(player => ({
                    player_id: player.player_id,
                    PlayerName: player.players.name,
                    score: "",
                    Fumbles: "",
                    DefensiveStops: "",
                    DefensiveScore: ""
                }));

                setTableData(tableData);
                setMessage(`Loaded matchup against ${opp_league}.`);
            } catch (error) {
                setMessage(`Error loading matchup: ${error.message}`);
            }
        };

        fetchMatchup();
    }, []);

    const handleImageUpload = (e) => {
        if (e.target.files.length > 3) {
            setMessage("You can upload a maximum of 3 images.");
            return;
        }
        setImages([...e.target.files]);
    };

    const handleAnalyze = async () => {
        setMessage("Analyzing images...");
        try {
            const uploadedUrls = [];

            for (const image of images) {
                const formData = new FormData();
                formData.append("file", image);

                const uploadResponse = await axios.put(
                    `${blobStorageUrl}/${image.name}?${sasToken}`,
                    image,
                    {
                        headers: {
                            "x-ms-blob-type": "BlockBlob",
                        },
                    }
                );

                if (uploadResponse.status === 201) {
                    uploadedUrls.push(`${blobStorageUrl}/${image.name}`);
                }
            }

            const analyzePromises = uploadedUrls.map((url) =>
                axios.post(
                    `${azureEndpoint}/formrecognizer/v2.1/layout/analyze?modelId=stats2`,
                    {
                        source: url,
                    },
                    {
                        headers: {
                            "Ocp-Apim-Subscription-Key": azureKey,
                        },
                    }
                )
            );

            const analyzeResponses = await Promise.all(analyzePromises);

            analyzeResponses.forEach((response) => {
                const extractedFields = response.data.fields;

                const updatedTable = tableData.map((player) => {
                    const matchedField = extractedFields.find(
                        (field) =>
                            field.PlayerName?.value?.toLowerCase()?.replace(/\s+/g, "") ===
                            player.PlayerName.toLowerCase().replace(/\s+/g, "")
                    );

                    return matchedField
                        ? { ...player, score: matchedField.score?.value || player.score }
                        : player;
                });

                setTableData(updatedTable);
            });

            setMessage("Scores updated from images.");
        } catch (error) {
            setMessage(`Error analyzing images: ${error.message}`);
        }
    };

    const handleTableChange = (index, field, value) => {
        const updatedData = [...tableData];
        updatedData[index][field] = value;
        setTableData(updatedData);
    };

    const handleSave = async () => {
        setMessage("Saving stats...");
        try {
            const rows = tableData.map(player => ({
                player_id: player.player_id,
                score: parseInt(player.score, 10),
                fumbles: parseInt(player.Fumbles, 10) || 0,
                defensive_stops: parseInt(player.DefensiveStops, 10) || 0,
                defensive_score: parseInt(player.DefensiveScore, 10) || 0
            }));

            const { error } = await supabase.from('daily_stats').insert(rows);

            if (error) throw error;

            setMessage("Stats successfully saved!");
        } catch (error) {
            setMessage(`Error saving stats: ${error.message}`);
        }
    };

    return (
        <div className="stats-update">
            <h1>Update Player Stats</h1>
            <div className="form-group">
                <label htmlFor="imageUpload">Upload Images</label>
                <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                />
            </div>
            <button onClick={handleAnalyze}>Analyze</button>

            {message && <p className="message">{message}</p>}

            <div className="table-container">
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th>Player Name</th>
                            <th>Score</th>
                            <th>Fumbles</th>
                            <th>Defensive Stops</th>
                            <th>Defensive Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((player, index) => (
                            <tr key={index}>
                                <td>{player.PlayerName}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={player.score}
                                        onChange={(e) => handleTableChange(index, "score", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={player.Fumbles}
                                        onChange={(e) => handleTableChange(index, "Fumbles", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={player.DefensiveStops}
                                        onChange={(e) => handleTableChange(index, "DefensiveStops", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={player.DefensiveScore}
                                        onChange={(e) => handleTableChange(index, "DefensiveScore", e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button onClick={handleSave}>Save Stats</button>
        </div>
    );
};

export default StatsUpdate;
