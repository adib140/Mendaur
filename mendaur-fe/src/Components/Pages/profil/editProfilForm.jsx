import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile, uploadUserAvatar } from "../../../services/api";
import { User, Mail, Phone, MapPin, Save, Loader2, Camera, X } from "lucide-react";
import { getStorageUrl } from "../../../config/api";
import "./editProfilForm.css";

export default function EditProfilForm({ user, onSuccess, onCancel }) {
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    nama: user.nama || "",
    email: user.email || "",
    no_hp: user.no_hp || "",
    alamat: user.alamat || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Avatar upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('File harus berupa gambar (JPEG, PNG, atau GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file tidak boleh lebih dari 2MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload avatar if selected
      if (selectedFile) {
        setUploadingAvatar(true);
        const avatarResult = await uploadUserAvatar(user.user_id, selectedFile);
        if (!avatarResult.success) {
          throw new Error(avatarResult.message || 'Gagal mengupload avatar');
        }
        setUploadingAvatar(false);
      }

      // Update profile data
      const result = await updateUserProfile(user.user_id, formData);

      if (result.status === 'success' || result.data) {
        setSuccess(true);
        
        // Refresh user data in context
        if (refreshUser) {
          await refreshUser();
        }

        // Call success callback after delay
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        throw new Error(result.message || 'Gagal memperbarui profil');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Terjadi kesalahan saat memperbarui profil');
    } finally {
      setLoading(false);
      setUploadingAvatar(false);
    }
  };

  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl;
    if (user.foto_profil) {
      return getStorageUrl(user.foto_profil);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&size=120&background=4CAF50&color=fff&bold=true`;
  };

  return (
    <div className="editProfilContainer">
      <h2 className="editProfilTitle">Edit Profil</h2>

      {/* Success Message */}
      {success && (
        <div className="successAlert">
          ✓ Profil berhasil diperbarui!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="errorAlert">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="editProfilForm">
        {/* Avatar Section */}
        <div className="avatarEditSection">
          <div className="avatarPreviewWrapper">
            <img
              src={getAvatarUrl()}
              alt="Avatar preview"
              className="avatarPreview"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama || 'User')}&size=120&background=4CAF50&color=fff&bold=true`;
              }}
            />
            <label htmlFor="avatarInput" className="avatarEditBtn">
              <Camera size={18} />
            </label>
            <input
              type="file"
              id="avatarInput"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
          {selectedFile && (
            <div className="selectedFileInfo">
              <span>{selectedFile.name}</span>
              <button type="button" onClick={clearSelectedFile} className="clearFileBtn">
                <X size={14} />
              </button>
            </div>
          )}
          <p className="avatarHint">Klik ikon kamera untuk mengubah foto</p>
        </div>

        {/* Form Fields */}
        <div className="formGroup">
          <label htmlFor="nama" className="formLabel">
            <User size={16} />
            Nama Lengkap
          </label>
          <input
            type="text"
            id="nama"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            className="formInput"
            placeholder="Masukkan nama lengkap"
            required
          />
        </div>

        <div className="formGroup">
          <label htmlFor="email" className="formLabel">
            <Mail size={16} />
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="formInput"
            placeholder="Masukkan email"
            required
          />
        </div>

        <div className="formGroup">
          <label htmlFor="no_hp" className="formLabel">
            <Phone size={16} />
            No. Handphone
          </label>
          <input
            type="tel"
            id="no_hp"
            name="no_hp"
            value={formData.no_hp}
            onChange={handleChange}
            className="formInput"
            placeholder="Masukkan nomor HP"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="alamat" className="formLabel">
            <MapPin size={16} />
            Alamat
          </label>
          <textarea
            id="alamat"
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            className="formTextarea"
            placeholder="Masukkan alamat lengkap"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="formActions">
          <button
            type="button"
            onClick={onCancel}
            className="cancelBtn"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="saveBtn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spinning" />
                {uploadingAvatar ? 'Mengupload...' : 'Menyimpan...'}
              </>
            ) : (
              <>
                <Save size={16} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
