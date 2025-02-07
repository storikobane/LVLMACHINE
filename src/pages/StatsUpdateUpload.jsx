import React, { useState } from "react";
import "../styles/statsupdate.css";
import axios from "axios";

const StatsUpdateUpload = () => {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  // Azure Blob Storage Configuration
  const STORAGE_ACCOUNT_NAME = "lineupsimages";
  const CONTAINER_NAME = "lineups";
  const SAS_TOKEN =
    "sp=racwdli&st=2025-01-22T01:53:55Z&se=2025-02-08T09:53:55Z&sv=2022-11-02&sr=c&sig=sUSZ6ff1ghmZWKy0KMTdCENx0Ua2Lcl5tnMLQ215y5c%3D";
  const BLOB_URL = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}`;

  // Azure Document Intelligence Configuration
  const apiKey = "87HP219ViBXwWNC6G9hYqDA4Ec2SiJf1YJ0K9InroAVpRxS4dw65JQQJ99BAACYeBjFXJ3w3AAALACOG4skb";
  const endpoint = "https://matchupsreader.cognitiveservices.azure.com";
  const DOCUMENT_INTELLIGENCE_ENDPOINT = `${endpoint}/formrecognizer/documentModels/stats5:analyze?api-version=2023-02-28`;

  const handleFileChange = (e) => {
    setImages(Array.from(e.target.files));
    setMessage(`${e.target.files.length} image(s) selected.`);
  };

  const uploadToBlobStorage = async (file) => {
    const blobUrl = `${BLOB_URL}/${encodeURIComponent(file.name)}?${SAS_TOKEN}`;
    console.log("Uploading to Blob URL:", blobUrl);

    try {
      await axios.put(blobUrl, file, {
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
      });
      return blobUrl.split("?")[0];
    } catch (error) {
      console.error("Error uploading to Blob Storage:", error.response?.data || error.message);
      throw new Error("Failed to upload image.");
    }
  };

  const analyzeDocument = async (imageUrl) => {
    try {
      const response = await axios.post(
        DOCUMENT_INTELLIGENCE_ENDPOINT,
        { urlSource: imageUrl }, // Use urlSource for Azure Form Recognizer
        {
          headers: {
            "Ocp-Apim-Subscription-Key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.analyzeResult;
    } catch (error) {
      console.error("Error analyzing document:", error.response?.data || error.message);
      throw new Error("Failed to analyze document.");
    }
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setMessage("Uploading and analyzing images...");
    const uploadedUrls = [];

    try {
      // Upload images to Blob Storage
      for (const image of images) {
        const imageUrl = await uploadToBlobStorage(image);
        uploadedUrls.push(imageUrl);
      }

      // Analyze each uploaded image
      const analyzedData = [];
      for (const imageUrl of uploadedUrls) {
        const analyzeResult = await analyzeDocument(imageUrl);
        analyzedData.push(...analyzeResult.fields);
      }

      // Process and filter results
      const filteredResults = analyzedData
        .filter((field) => field.PlayerName && field.Score)
        .map((field) => ({
          playerName: field.PlayerName?.value || "",
          score: field.Score?.value || 0,
        }));

      setResults(filteredResults);
      setMessage("Images analyzed successfully. Review and save the data.");
    } catch (error) {
      console.error("Error during upload or analysis:", error);
      setMessage("An error occurred while uploading or analyzing images.");
    }
  };

  const handleSave = () => {
    if (results.length === 0) {
      alert("No data to save.");
      return;
    }

    console.log("Saving the following data:", results);
    alert("Data saved successfully (this is a placeholder).");
  };

  return (
    <div className="stats-update-upload">
      <h1>Upload Match Stats</h1>

      <div className="upload-section">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-input"
        />
        <label htmlFor="file-input" className="upload-button">
          Select Images
        </label>
        <button onClick={handleAnalyze} className="analyze-button">
          Analyze Images
        </button>
      </div>

      <div className="results-section">
        {results.length > 0 && (
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td>{result.playerName}</td>
                    <td>{result.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <button onClick={handleSave} className="save-button">
          Save Data
        </button>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default StatsUpdateUpload;
