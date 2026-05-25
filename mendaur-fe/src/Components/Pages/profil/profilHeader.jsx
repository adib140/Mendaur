import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUnlockedBadges, setBadgeTitle, uploadUserAvatar } from "../../../services/api";
import { Upload, X, Star, Trophy, ChevronDown } from "lucide-react";
import { getStorageUrl } from "../../../config/api";
import "../profil/profilHeader.css";

export default function ProfilHeader() {
  const { user, refreshUser } = useAuth();
  const [userBadges, setUserBadges] = useState([]);
  const [activeBadge, setActiveBadge] = useState(null);
  const [showBadgeDropdown, setShowBadgeDropdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [savingBadge, setSavingBadge] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('File harus berupa gambar (JPEG, PNG, atau GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran file tidak boleh lebih dari 2MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.user_id) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const result = await uploadUserAvatar(user.user_id, selectedFile);

      if (result.success) {
        setUploadSuccess(true);
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);

        // Auto-close success message after 3 seconds
        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);

        // Refresh page to show new avatar
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setUploadError(result.message || 'Gagal mengupload avatar');
      }
    } catch (error) {
      setUploadError(error.message || 'Terjadi kesalahan saat mengupload');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const fetchUserBadges = async () => {
    try {
      // Fetch unlocked badges only
      const result = await getUnlockedBadges(user.user_id);

      if (result.status === 'success') {
        const badgesData = result.data?.unlocked_badges || [];
        
        setUserBadges(badgesData);

        // Get current badge title from backend
        const currentBadgeTitleId = result.data?.current_badge_title_id;
        
        if (currentBadgeTitleId) {
          setActiveBadge(currentBadgeTitleId);
        } else if (badgesData.length > 0) {
          // Default to first unlocked badge if no title set
          setActiveBadge(badgesData[0].badge_id);
        }
      }
    } catch {
      // Silent fail - badges are optional feature
    }
  };

  // Fetch user badges from backend
  useEffect(() => {
    if (user?.user_id) {
      fetchUserBadges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  const handleSelectBadge = async (badgeId) => {
    setSavingBadge(true);
    try {
      // Save to backend using dedicated endpoint
      const result = await setBadgeTitle(user.user_id, badgeId);
      
      if (result.status === 'success') {
        setActiveBadge(badgeId);
        setShowBadgeDropdown(false);
        
        // Refresh user data to sync badge_title_id
        if (refreshUser) {
          await refreshUser();
        }
      }
    } catch {
      alert("Gagal mengatur badge title. Pastikan badge sudah di-unlock.");
    } finally {
      setSavingBadge(false);
    }
  };

  const currentBadge = userBadges.find(b => b.badge_id === activeBadge);

  // Generate avatar URL - handles both Cloudinary URLs and local storage paths
  const getAvatarUrl = () => {
    if (user.foto_profil) {
      return getStorageUrl(user.foto_profil);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&size=120&background=4CAF50&color=fff&bold=true`;
  };

  return (
    <div className="profilHeader">
      {/* Success Message */}
      {uploadSuccess && (
        <div className="uploadSuccessMessage">
          ✓ Avatar berhasil diupload! Halaman akan dimuat ulang...
        </div>
      )}

      {/* Main Profile Card */}
      <div className="profilCard">
        {/* Left Section: Avatar + Info */}
        <div className="profilLeftSection">
          <div className="avatarWrapper">
            <img
              src={getAvatarUrl()}
              alt={`${user.nama} profile`}
              className="profilAvatar"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama || 'User')}&size=120&background=4CAF50&color=fff&bold=true`;
              }}
            />
            <button
              className="uploadAvatarBtn"
              onClick={() => setShowUploadModal(true)}
              title="Upload avatar baru"
            >
              <Upload size={16} />
            </button>
          </div>
          
          <div className="profilDetails">
            <h2 className="profilName">{user.nama}</h2>
            <p className="profilEmail">{user.email}</p>
            
            {/* Level Badge */}
            <div className="levelBadge">
              <Trophy size={14} />
              <span>{user.level || "Member"}</span>
            </div>

            {/* Badge Title Selector */}
            {userBadges.length > 0 ? (
              <div className="badgeTitleSelector">
                <button 
                  className="badgeTitleBtn"
                  onClick={() => setShowBadgeDropdown(!showBadgeDropdown)}
                  disabled={savingBadge}
                >
                  <span className="badgeTitleIcon">
                    {currentBadge?.icon || '🏆'}
                  </span>
                  <span className="badgeTitleText">
                    {currentBadge?.nama || "Pilih Badge Title"}
                  </span>
                  <ChevronDown size={16} className={showBadgeDropdown ? 'rotated' : ''} />
                </button>
                
                {showBadgeDropdown && (
                  <div className="badgeDropdown">
                    <div className="badgeDropdownHeader">
                      Pilih Badge sebagai Title ({userBadges.length} badge tersedia)
                    </div>
                    {userBadges.map((badge, index) => (
                      <button
                        key={badge.badge_id || `badge-${index}`}
                        className={`badgeDropdownItem ${activeBadge === badge.badge_id ? 'selected' : ''}`}
                        onClick={() => handleSelectBadge(badge.badge_id)}
                      >
                        <span className="badgeItemIcon">{badge.icon || '🏆'}</span>
                        <div className="badgeItemInfo">
                          <span className="badgeItemName">{badge.nama || `Badge ${badge.badge_id}`}</span>
                          <span className="badgeItemReward">+{badge.reward_poin || 0} poin</span>
                        </div>
                        {activeBadge === badge.badge_id && <span className="checkMark">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="noBadgesMessage">
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Belum ada badge yang di-unlock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Points Display */}
        <div className="profilRightSection">
          <div className="pointsCard">
            <div className="pointsIcon">
              <Star size={24} />
            </div>
            <div className="pointsInfo">
              <span className="pointsLabel">Saldo Poin</span>
              <span className="pointsValue">{(user.actual_poin ?? 0).toLocaleString('id-ID')}</span>
              <span className="pointsSubLabel" style={{ fontSize: '11px', color: '#94a3b8' }}>
                Poin terkumpul: {(user.display_poin ?? user.actual_poin ?? 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="uploadModalOverlay">
          <div className="uploadModal">
            <div className="uploadModalHeader">
              <h3>Upload Avatar Baru</h3>
              <button
                className="closeBtn"
                onClick={handleCloseModal}
                disabled={uploading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="uploadModalContent">
              {/* Preview */}
              {previewUrl && (
                <div className="previewContainer">
                  <img src={previewUrl} alt="Preview" className="previewImage" />
                </div>
              )}

              {/* File Input */}
              <div className="fileInputWrapper">
                <input
                  type="file"
                  id="avatarInput"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatarInput" className="fileInputLabel">
                  <Upload size={20} style={{ marginRight: '8px' }} />
                  {selectedFile ? `${selectedFile.name}` : 'Pilih File atau Drag & Drop'}
                </label>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="errorMessage">
                  ⚠ {uploadError}
                </div>
              )}

              {/* Info Text */}
              <p className="uploadInfo">
                Format: JPEG, PNG, atau GIF<br />
                Ukuran maksimal: 2MB
              </p>
            </div>

            <div className="uploadModalFooter">
              <button
                className="cancelBtn"
                onClick={handleCloseModal}
                disabled={uploading}
              >
                Batal
              </button>
              <button
                className="uploadBtn"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Mengupload...' : 'Upload Avatar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
