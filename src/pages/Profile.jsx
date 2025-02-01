import React from 'react';
    import '../styles/profile.css';

    const Profile = () => {
      return (
        <div className="profile-page">
          <h1>User Profile</h1>
          <div className="profile-info">
            <p><strong>Name:</strong> John Doe</p>
            <p><strong>Email:</strong> johndoe@example.com</p>
            <p><strong>League:</strong> Pro League</p>
            <p><strong>Rank:</strong> 1st</p>
          </div>
        </div>
      );
    };

    export default Profile;
