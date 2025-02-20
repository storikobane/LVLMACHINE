import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For routing
import axios from 'axios';
import '../styles/lineups.css';

function Lineups() {
  const [players, setPlayers] = useState(
    Array.from({ length: 16 }, (_, i) => ({
      lineup_pos: i + 1,
      player_name: '',
      off_rating: 0,
    }))
  );
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Azure Blob Storage Configuration
  const STORAGE_ACCOUNT_NAME = "lineupsimages";
  const CONTAINER_NAME = "lineups";
  const SAS_TOKEN =
    "sv=2022-11-02&ss=b&srt=sco&sp=rwdlaciyx&se=2025-02-20T23:41:16Z&st=2025-02-20T15:41:16Z&spr=https,http&sig=gw0OV7j756OPJBuDsK8mOBG8MUv%2BlLzqXbsUEMCCA1M%3D";
  const BLOB_URL = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}`;

  const DOCUMENT_INTELLIGENCE_ENDPOINT =
    "https://matchupsreader.cognitiveservices.azure.com/formrecognizer/documentModels/lineups6:analyze?api-version=2023-07-31";
  const DOCUMENT_INTELLIGENCE_KEY =
    "87HP219ViBXwWNC6G9hYqDA4Ec2SiJf1YJ0K9InroAVpRxS4dw65JQQJ99BAACYeBjFXJ3w3AAALACOG4skb";

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadToBlobStorage = async (file) => {
    const blobUrl = `${BLOB_URL}/${encodeURIComponent(file.name)}?${SAS_TOKEN}`;
    console.log('Uploading to Blob URL:', blobUrl);

    try {
      await axios.put(blobUrl, file, {
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type,
        },
      });
      return blobUrl.split('?')[0];
    } catch (error) {
      console.error('Error uploading to Blob Storage:', error.response?.data || error.message);
      throw new Error('Failed to upload image.');
    }
  };

  const analyzeDocument = async (imageUrl) => {
    try {
      const response = await axios.post(
        DOCUMENT_INTELLIGENCE_ENDPOINT,
        { urlSource: imageUrl },
        {
          headers: {
            'Ocp-Apim-Subscription-Key': DOCUMENT_INTELLIGENCE_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      const operationLocation = response.headers['operation-location'];
      const result = await pollForResult(operationLocation);
      return result.analyzeResult;
    } catch (error) {
      console.error('Error analyzing document:', error.response?.data || error.message);
      throw new Error('Failed to analyze document.');
    }
  };

  const pollForResult = async (operationLocation) => {
    let result = null;
    while (!result || result.status === 'running' || result.status === 'notStarted') {
      const pollResponse = await axios.get(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': DOCUMENT_INTELLIGENCE_KEY,
        },
      });
      result = pollResponse.data;
      if (result.status === 'succeeded') {
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error('Document analysis failed.');
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      alert('Please select an image.');
      return;
    }
    setLoading(true);

    try {
      const imageUrl = await uploadToBlobStorage(imageFile);
      console.log('Uploaded Image URL:', imageUrl);

      const analyzeResult = await analyzeDocument(imageUrl);
      console.log('Analyze Result:', JSON.stringify(analyzeResult, null, 2));

      const content = analyzeResult?.content || '';
      const lines = content.split('\n').map((line) => line.trim());
      console.log('Extracted Content Lines:', lines);

      // Filter lines to exclude unnecessary data like headers
      const filteredLines = lines.filter(
        (line) =>
          !line.match(/^(date|pos|name|off\.?|1\/20)$/i) &&
          line.trim() !== ''
      );
      console.log('Filtered Content Lines:', filteredLines);

      // Parse filtered lines into players' data
      const playersData = [];
      for (let i = 0; i < filteredLines.length; i++) {
        if (isNaN(parseInt(filteredLines[i]))) {
          const playerName = filteredLines[i];
          const offRating = parseInt(filteredLines[i + 1]);

          if (!isNaN(offRating)) {
            playersData.push({ player_name: playerName, off_rating: offRating });
            i++;
          }
        }
      }

      console.log('Mapped Players Data:', playersData);

      // Fill in the players array up to 16 entries
      const completePlayers = Array.from({ length: 16 }, (_, i) => ({
        lineup_pos: i + 1,
        player_name: playersData[i]?.player_name || '',
        off_rating: playersData[i]?.off_rating || 0,
      }));

      console.log('Final Complete Players Data:', completePlayers);
      setPlayers(completePlayers);
    } catch (error) {
      console.error('Error processing image:', error.message);
      alert('Error processing image. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const saveLineupsAndAdvance = () => {
    console.log("Saving lineup and navigating...");
    navigate('/reorder', { state: { players } });
  };

 const editLineups = () => {
  navigate('/editlineups', { state: { players } });
};


  return (
    <div className="lineups-page">
      <h2>Lineups</h2>
      <div className="top-buttons">
        <label className="glow-button input-div">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          Grip It
        </label>
        <button className="glow-button" onClick={handleImageUpload} disabled={loading}>
          {loading ? 'Processing...' : 'Rip It'}
        </button>
        <button className="glow-button" onClick={editLineups}>
          Edit Lineup
        </button>
      </div>
      <div className="player-list">
        {players.map((player, index) => (
          <div className="player-row" key={index}>
            <span>{player.lineup_pos}</span>
          <input
  type="text"
  className="name-input"
  value={player.player_name}
  placeholder="Player Name"
  onChange={(e) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].player_name = e.target.value;
    setPlayers(updatedPlayers);
  }}
/>
<input
  type="number"
  className="rating-input"
  value={player.off_rating}
  placeholder="Rating"
  onChange={(e) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].off_rating = parseInt(e.target.value) || 0;
    setPlayers(updatedPlayers);
  }}
/>

          </div>
        ))}
      </div>
      <button className="save-button" onClick={saveLineupsAndAdvance}>
        Save & Advance
      </button>
    </div>
  );
}

export default Lineups;
