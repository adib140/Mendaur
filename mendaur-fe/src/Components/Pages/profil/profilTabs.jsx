// components/ProfilTabs.jsx
import React from "react";
import "../profil/profilTabs.css";

export default function ProfilTabs({ activeTab, setActiveTab }) {
  return (
    <div className="profilTabs">
      <div className="tabWrapper">
        <button
          className={`tabButton ${activeTab === "badge" ? "active" : ""}`}
          onClick={() => setActiveTab("badge")}
        >
          Badge
        </button>
        <button
          className={`tabButton ${activeTab === "data" ? "active" : ""}`}
          onClick={() => setActiveTab("data")}
        >
          Data Pengguna
        </button>
      </div>
    </div>
  );
}