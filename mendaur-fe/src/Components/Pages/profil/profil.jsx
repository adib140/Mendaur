// pages/ProfilPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./profil.css";
import ProfilHeader from "../profil/profilHeader";
import ProfilTabs from "../profil/profilTabs";
import AchievementList from "../profil/achievementList";
import UserData from "../profil/userData";
import EditProfilForm from "../profil/editProfilForm";
import { SquarePen, X } from "lucide-react";
import cache from "../../../utils/cache";

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState("badge");
  const [isEditing, setIsEditing] = useState(false);
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  // Shared state to persist data across tab switches
  const [badgeData, setBadgeData] = useState(null);
  const [userData, setUserData] = useState(null);
  const dataFetchedRef = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Load cached data on mount to prevent reload when switching tabs
  useEffect(() => {
    if (user?.user_id && !dataFetchedRef.current) {
      cache.checkUserChange(user.user_id);
      
      // Load badge data from cache if available
      const cachedBadges = cache.get(`achievement_badges_${user.user_id}_all`);
      if (cachedBadges) {
        setBadgeData(cachedBadges);
      }
      
      // Load user data from cache if available
      const cachedUserDetail = cache.get(`userData_detail_${user.user_id}`);
      const cachedActivity = cache.get(`userData_activity_${user.user_id}`);
      const cachedUserBadges = cache.get(`userData_badges_${user.user_id}`);
      
      if (cachedUserDetail || cachedActivity || cachedUserBadges) {
        setUserData({
          userCreatedAt: cachedUserDetail,
          aktivitas: cachedActivity || [],
          badgeInfo: cachedUserBadges || { count: 0, rewards: 0 }
        });
      }
      
      dataFetchedRef.current = true;
    }
  }, [user?.user_id]);

  // Callback to update badge data from AchievementList
  const onBadgeDataLoaded = useCallback((data) => {
    setBadgeData(data);
  }, []);

  // Callback to update user data from UserData
  const onUserDataLoaded = useCallback((data) => {
    setUserData(data);
  }, []);

  const handleEditSuccess = () => {
    setIsEditing(false);
    // Clear cached data to force refresh
    if (user?.user_id) {
      cache.clear(`userData_detail_${user.user_id}`);
      cache.clear(`userData_activity_${user.user_id}`);
      cache.clear(`userData_badges_${user.user_id}`);
    }
    // Refresh user data after successful edit
    if (refreshUser) {
      refreshUser();
    }
  };

  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div className="profilPage">
      <div className="editButtonWrapper">
        <button 
          className={`editButton ${isEditing ? 'cancelMode' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <X size={16} style={{ marginRight: "6px" }} />
              Batal
            </>
          ) : (
            <>
              <SquarePen size={16} style={{ marginRight: "6px" }} />
              Edit Profil
            </>
          )}
        </button>
      </div>

      {/* Show Edit Form when editing */}
      {isEditing ? (
        <EditProfilForm 
          user={user} 
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <ProfilHeader />
          <ProfilTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="tabContent">
            <div className="tabContentWrapper">
              {activeTab === "badge" && (
                <AchievementList 
                  cachedData={badgeData}
                  onDataLoaded={onBadgeDataLoaded}
                />
              )}
              {activeTab === "data" && (
                <UserData 
                  cachedData={userData}
                  onDataLoaded={onUserDataLoaded}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}