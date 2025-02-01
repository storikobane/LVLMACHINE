import React, { useState } from "react";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import "../styles/matchupUpload.css";

// Supabase configuration
const supabaseUrl = "https://nuvlkvedpsebawqofllu.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51dmxrdmVkcHNlYmF3cW9mbGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjE2MTEsImV4cCI6MjA1MDkzNzYxMX0.B_G4x5Mrs9XpQyhSzBVddPG4tn1_0UgiJEXD0ZanK6U";
const supabase = createClient(supabaseUrl, supabaseKey);

const MatchupUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opponentLeague, setOpponentLeague] = useState({
    leagueName: "",
    leagueTier: "",
  });
  const [opponentsData, setOpponentsData] = useState(
    Array(16).fill({ opponent_name: "", defensive_rating: "" })
  );
  const navigate = useNavigate();

  // Azure Configuration
  const apiKey = "87HP219ViBXwWNC6G9hYqDA4Ec2SiJf1YJ0K9InroAVpRxS4dw65JQQJ99BAACYeBjFXJ3w3AAALACOG4skb";
  const endpoint = "https://matchupsreader.cognitiveservices.azure.com";
  const blobStorageUrl =
    "https://matchupimagesstorage.blob.core.windows.net/matchupimages";
  const sasToken =
    "?sp=racwdli&st=2025-01-27T23:47:09Z&se=2025-02-28T07:47:09Z&sv=2022-11-02&sr=c&sig=cc%2BQkc%2BGpCg6iXPTX8iPocMJdJaztKDEIa3WDgjJrAE%3D";

  const handleFilesChange = (e) => {
    setUploadedFiles(Array.from(e.target.files));
  };

  const handleOpponentChange = (index, field, value) => {
    const updatedData = [...opponentsData];
    updatedData[index][field] = value;
    setOpponentsData(updatedData);
  };

  const analyzeImages = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload images first.");
      return;
    }

    setLoading(true);
    try {
      const allParsedData = [];
      for (const file of uploadedFiles) {
        const blobUrl = `${blobStorageUrl}/${file.name}${sasToken}`;

        // Upload file to Azure Blob Storage
        await axios.put(blobUrl, file, {
          headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": file.type,
          },
        });

        // Analyze uploaded file
        const response = await axios.post(
          `${endpoint}/formrecognizer/documentModels/lvl4:analyze?api-version=2022-08-31`,
          { urlSource: blobUrl },
          {
            headers: {
              "Ocp-Apim-Subscription-Key": apiKey,
              "Content-Type": "application/json",
            },
          }
        );

        const operationLocation = response.headers["operation-location"];
        if (!operationLocation) {
          throw new Error("Operation location missing from response headers.");
        }

        // Poll for result
        const result = await pollForResult(operationLocation);
        const parsedData = parseResults(result);

        allParsedData.push(...parsedData);
      }

      // Remove duplicates and update opponentsData
      const uniqueData = Array.from(
        new Map(
          allParsedData.map((item) => [item.opponent_name, item])
        ).values()
      );

      setOpponentsData(uniqueData);
    } catch (error) {
      console.error("Error during image analysis:", error.response?.data || error.message);
      alert("Failed to analyze the images.");
    } finally {
      setLoading(false);
    }
  };

  const pollForResult = async (operationLocation) => {
    while (true) {
      const response = await axios.get(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
      });

      if (response.data.status === "succeeded") {
        return response.data.analyzeResult;
      } else if (response.data.status === "failed") {
        throw new Error("Analysis failed.");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const parseResults = (analyzeResult) => {
    if (!analyzeResult.documents || analyzeResult.documents.length === 0) {
      throw new Error("Invalid analysis result.");
    }

    const document = analyzeResult.documents[0];
    const leagueName =
      document.fields["opponent league name"]?.valueString || "Unknown League";
    const leagueTier =
      document.fields["opponent league tier"]?.valueString || "Unknown Tier";

    setOpponentLeague({ leagueName, leagueTier });

    const opponents = [];
    for (let i = 1; i <= 16; i++) {
      const name = document.fields[`opp.p${i}`]?.valueString || "";
      const defRating = document.fields[`opp.p${i}.def`]?.valueString || "";

      if (name && defRating) {
        opponents.push({
          opponent_name: name,
          defensive_rating: parseInt(defRating, 10),
        });
      }
    }

    return opponents;
  };

const handleSaveAndAdvance = async () => {
  try {
    // Remove duplicates and rank opponents
    const rankedOpponents = opponentsData
      .filter(
        (opponent) =>
          opponent.opponent_name.trim() !== "" && opponent.defensive_rating !== ""
      )
      .sort((a, b) => b.defensive_rating - a.defensive_rating)
      .map((opponent, index) => ({
        ...opponent,
        rank: index + 1, // Assign rank
      }));

    // Format data for Supabase
    const formattedData = rankedOpponents.map((opponent) => ({
      date: new Date().toISOString().split("T")[0], // Format as `YYYY-MM-DD`
      league_name: opponentLeague.leagueName,
      league_tier: opponentLeague.leagueTier,
      opponent_name: opponent.opponent_name,
      defensive_rating: opponent.defensive_rating,
      rank: opponent.rank, // Include rank
    }));

    // Insert into Supabase
    const { error } = await supabase.from("opponents").insert(formattedData);

    if (error) {
      console.error("Error saving opponents:", error);
      alert("Failed to save opponent data.");
      return;
    }

    // Navigate to the Matchup Generator page
    navigate("/MatchupGen");
  } catch (error) {
    console.error("Error during save and advance:", error);
    alert("An error occurred while saving the data. Please try again.");
  }
};

  const handleReset = () => {
    setUploadedFiles([]);
    setOpponentLeague({ leagueName: "", leagueTier: "" });
    setOpponentsData(Array(16).fill({ opponent_name: "", defensive_rating: "" }));
  };

  return (
    <div className="matchups-page">
      {loading ? (
        <div className="loader">
          <div className="loader-text">Analyzing...</div>
          <div className="load"></div>
        </div>
      ) : (
        <>
          <h2>Upload Opponent Data</h2>
          <div className="upload-section">
            <label htmlFor="image-upload" className="glow-button">
              Upload Images
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="upload-input"
            />
            <button className="glow-button" onClick={analyzeImages} disabled={loading}>
              Analyze Images
            </button>
            <button className="glow-button" onClick={handleReset}>
              Reset
            </button>
          </div>

          {opponentLeague.leagueName && (
            <div className="league-info">
              <h3>{opponentLeague.leagueName}</h3>
              <p>Tier: {opponentLeague.leagueTier}</p>
            </div>
          )}

          <table className="opponents-table">
            <thead>
              <tr>
                <th>Opponent Name</th>
                <th>Defensive Rating</th>
              </tr>
            </thead>
            <tbody>
              {opponentsData.map((opponent, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={opponent.opponent_name}
                      onChange={(e) =>
                        handleOpponentChange(index, "opponent_name", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={opponent.defensive_rating || ""}
                      onChange={(e) =>
                        handleOpponentChange(index, "defensive_rating", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="glow-button" onClick={handleSaveAndAdvance}>
            Save & Advance
          </button>
        </>
      )}
    </div>
  );
};

export default MatchupUpload;
