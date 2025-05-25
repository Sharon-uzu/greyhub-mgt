import React, { useState } from "react";

export default function AdminForm() {
  const [profile, setProfile] = useState({
    name: "Jane Doe",
    email: "jane.doe@example.com",
    department: "Marketing",
    password: "",
    avatarUrl: "https://via.placeholder.com/150",
  });

  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    departmentAnnouncements: false,
  });

  const [preferences, setPreferences] = useState({
    theme: "light",
    twoFactorAuth: false,
  });

  const handleProfileChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleProfileChange("avatarUrl", url);
    }
  };

  const handleNotificationsChange = (field, value) => {
    setNotifications({ ...notifications, [field]: value });
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences({ ...preferences, [field]: value });
  };

  return (
    <div className="admin-container">
      <div className="admin-card">

        <div className="tab-content">
          <h2>Create User</h2><br />
          
          <div>
            <label htmlFor="name">Full Name</label>
            <input id="name" value={profile.fullname} onChange={(e) => handleProfileChange("fullname", e.target.value)} />
          </div>
          <div>
            <label htmlFor="username">Username</label>
            <input id="email" type="text" value={profile.username} onChange={(e) => handleProfileChange("username", e.target.value)} />
          </div>

          <div>
            <label htmlFor="username">Role</label>
            <select name="" id="">
              <option value="user">User</option>
              <option value="subadmin">Sub Admin</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="password">New Password</label>
            <input id="password" type="password" value={profile.password} onChange={(e) => handleProfileChange("password", e.target.value)} />
          </div>
          <button className="save-button">Save</button>
        </div>

        
      </div>
    </div>
  );
}
