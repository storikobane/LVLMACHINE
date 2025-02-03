import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "../supabaseClient";

const Profile = () => {
  const { id } = useParams(); // Get user ID from URL
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      let { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", id)
        .single();

      if (!error) setPlayer(data);
    };
    fetchPlayer();
  }, [id]);

  if (!player) return <p>Loading...</p>;

  return (
    <div>
      <h1>{player.name}</h1>
      <p>Discord: {player.discord_name}</p>
    </div>
  );
};

export default Profile;
