import React, { useState } from "react";
import "../styles/statsupdate.css";
import axios from "axios";

const StatsUpdateUpload = () => {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [models, setModels] = useState([]); // State to hold model list

  // Azure Blob Storage Configuration
  const STORAGE_ACCOUNT_NAME = "statimages";
  const CONTAINER_NAME = "stats1";
  const SAS_TOKEN =
    "sp=rcwd&st=2025-02-10T05:58:55Z&se=2025-05-24T12:58:55Z&sv=2022-11-02&sr=c&sig=jZhr%2B8hP51j5qzhwlxU8Pw3THL8IJ1jGRntD0yxqCOU%3D";
  const BLOB_URL = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}`;

  // Azure Document Intelligence Configuration
  const apiKey = "87HP219ViBXwWNC6G9hYqDA4Ec2SiJf1YJ0K9InroAVpRxS4dw65JQQJ99BAACYeBjFXJ3w3AAALACOG4skb";
  const endpoint = "https://matchupsreader.cognitiveservices.azure.com";
  const DOCUMENT_INTELLIGENCE_ENDPOINT = `${endpoint}/formrecognizer/documentModels/stats1:analyze?api-version=2024-11-30`;
  const LIST_MODELS_ENDPOINT = `${endpoint}/formrecognizer/documentModels?api-version=2024-11-30`;

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
          "Content-Type": "application/octet-stream",
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
        { url: imageUrl },
        {
          headers: {
            "Ocp-Apim-Subscription-Key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.headers["operation-location"]) {
        throw new Error("Operation location not found.");
      }

      const operationUrl = response.headers["operation-location"];

      // Polling for results
      let result;
      for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 3000)); // Wait 3 sec
        const pollResponse = await axios.get(operationUrl, {
          headers: { "Ocp-Apim-Subscription-Key": apiKey },
        });

        if (pollResponse.data.status === "succeeded") {
          result = pollResponse.data.analyzeResult.documents[0]?.fields;
          break;
        }
      }

      if (!result) throw new Error("Analysis took too long.");

      return result;
    } catch (error) {
      console.error("Error analyzing document:", error.response?.data || error.message);
      throw new Error("Failed to analyze document.");
    }
  };

  const listModels = async () => {
    try {
      const response = await axios.get(LIST_MODELS_ENDPOINT, {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      });

      setModels(response.data.documentModels || []);
      setMessage("Models listed successfully.");
    } catch (error) {
      console.error("Error listing models:", error.response?.data || error.message);
      setMessage("Failed to list models.");
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
      for (const image of images) {
        const imageUrl = await uploadToBlobStorage(image);
        uploadedUrls.push(imageUrl);
      }

      const analyzedData = [];
      for (const imageUrl of uploadedUrls) {
        const analyzeResult = await analyzeDocument(imageUrl);
        analyzedData.push(...Object.values(analyzeResult));
      }

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
        <button onClick={listModels} className="list-models-button">
          List Models
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

      {models.length > 0 && (
        <div className="models-list">
          <h2>Available Models</h2>
          <ul>
            {models.map((model, index) => (
              <li key={index}>
                <strong>{model.modelId}</strong> - {model.description || "No description"} - Status:{" "}
                {model.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default StatsUpdateUpload;
