import React, { useState, useEffect, useCallback } from "react";
import "./FormSetorSampah.css";
import { useAuth } from "../Pages/context/AuthContext";
import { API_BASE_URL } from "../../config/api";
import { 
  MapPin, 
  Navigation, 
  Calendar, 
  Clock, 
  Image as ImageIcon, 
  X, 
  Check, 
  ChevronDown,
  FileText,
  Package,
  Shirt,
  Monitor,
  MoreHorizontal,
  Layers
} from "lucide-react";

// Kategori sampah dengan icon
const KATEGORI_SAMPAH = [
  { id: 'kertas', label: 'Kertas', icon: FileText, color: '#D97706' },
  { id: 'plastik', label: 'Plastik', icon: Package, color: '#2563EB' },
  { id: 'logam', label: 'Logam', icon: Layers, color: '#6B7280' },
  { id: 'tekstil', label: 'Tekstil', icon: Shirt, color: '#DC2626' },
  { id: 'elektronik', label: 'Elektronik', icon: Monitor, color: '#F59E0B' },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal, color: '#8B5CF6' },
];

export default function FormSetorSampah({ 
  onClose, 
  userId, 
  preSelectedSchedule,
  preSelectedKategori 
}) {
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    nama: "",
    noHp: "",
    lokasi: "",
    koordinat: { lat: null, lng: null },
    jenis: preSelectedKategori || "",
    foto: null,
    jadwalId: preSelectedSchedule || "",
  });

  const [jadwalList, setJadwalList] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [showJadwalDropdown, setShowJadwalDropdown] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState(null);

  // Set user data otomatis saat pertama kali load
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nama: user.nama || user.name || "",
        noHp: user.no_hp || user.phone || "",
      }));
    }
  }, [user]);

  // Update kategori when preSelectedKategori changes
  useEffect(() => {
    if (preSelectedKategori) {
      setFormData(prev => ({ ...prev, jenis: preSelectedKategori }));
    }
  }, [preSelectedKategori]);

  // Update jadwalId when preSelectedSchedule changes
  useEffect(() => {
    if (preSelectedSchedule !== undefined && preSelectedSchedule !== null && preSelectedSchedule !== "") {
      setFormData(prev => ({ ...prev, jadwalId: preSelectedSchedule }));
      // Find and set the selected jadwal object
      const jadwal = jadwalList.find((j, idx) => 
        j.jadwal_penyetoran_id === preSelectedSchedule || idx === preSelectedSchedule
      );
      if (jadwal) setSelectedJadwal(jadwal);
    }
  }, [preSelectedSchedule, jadwalList]);

  // Ambil jadwal aktif dari backend
  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jadwal-penyetoran`);
        if (!res.ok) throw new Error("Gagal mengambil jadwal");
        const result = await res.json();
        let schedules = result.data || [];
        
        // Filter hanya jadwal yang buka
        schedules = schedules.filter(s => 
          s.status?.toLowerCase() === 'buka' || 
          s.status?.toLowerCase() === 'aktif' ||
          s.status?.toLowerCase() === 'active' ||
          !s.status // Include if no status (assume open)
        );
        
        setJadwalList(schedules);
        
        // Set selected jadwal if preSelectedSchedule exists
        if (preSelectedSchedule !== undefined && preSelectedSchedule !== null) {
          const jadwal = schedules.find((j, idx) => 
            j.jadwal_penyetoran_id === preSelectedSchedule || idx === preSelectedSchedule
          );
          if (jadwal) setSelectedJadwal(jadwal);
        }
      } catch {
        setJadwalList([]);
      }
    };
    fetchJadwal();
  }, [preSelectedSchedule]);

  // Handle kategori selection
  const handleKategoriSelect = (kategoriId) => {
    setFormData(prev => ({
      ...prev,
      jenis: prev.jenis === kategoriId ? "" : kategoriId
    }));
    if (errors.jenis) {
      setErrors(prev => ({ ...prev, jenis: null }));
    }
  };

  // Handle jadwal selection
  const handleJadwalSelect = (jadwal, index) => {
    setSelectedJadwal(jadwal);
    setFormData(prev => ({ ...prev, jadwalId: index.toString() }));
    setShowJadwalDropdown(false);
    if (errors.jadwal) {
      setErrors(prev => ({ ...prev, jadwal: null }));
    }
  };

  // Handle foto change dengan preview dan kompresi
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, foto: "Ukuran file maksimal 5MB" }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, foto: "File harus berupa gambar" }));
        return;
      }

      // Clear previous errors
      if (errors.foto) {
        setErrors(prev => ({ ...prev, foto: null }));
      }

      // Compress image if > 1MB
      if (file.size > 1024 * 1024) {
        compressImage(file);
      } else {
        setFormData(prev => ({ ...prev, foto: file }));
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setFotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Compress image untuk mengurangi ukuran file
  const compressImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize jika terlalu besar (max 1920px)
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality 0.8
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log('Original size:', (file.size / 1024).toFixed(2), 'KB');
            console.log('Compressed size:', (compressedFile.size / 1024).toFixed(2), 'KB');

            setFormData(prev => ({ ...prev, foto: compressedFile }));
            
            // Create preview from compressed
            const previewReader = new FileReader();
            previewReader.onloadend = () => {
              setFotoPreview(previewReader.result);
            };
            previewReader.readAsDataURL(compressedFile);
          },
          'image/jpeg',
          0.8 // Quality 80%
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Remove foto
  const handleRemoveFoto = () => {
    setFormData(prev => ({ ...prev, foto: null }));
    setFotoPreview(null);
  };

  // Get current location
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrors(prev => ({ ...prev, lokasi: "Browser tidak mendukung geolocation" }));
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        setFormData(prev => ({
          ...prev,
          lokasi: mapsLink,
          koordinat: { lat: latitude, lng: longitude }
        }));
        
        setGettingLocation(false);
        if (errors.lokasi) {
          setErrors(prev => ({ ...prev, lokasi: null }));
        }
      },
      (error) => {
        setGettingLocation(false);
        let errorMsg = "Gagal mendapatkan lokasi";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Izin lokasi ditolak. Aktifkan izin lokasi di browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Informasi lokasi tidak tersedia";
            break;
          case error.TIMEOUT:
            errorMsg = "Waktu habis saat mendapatkan lokasi";
            break;
          default:
            break;
        }
        setErrors(prev => ({ ...prev, lokasi: errorMsg }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [errors.lokasi]);

  // Auto get location on mount
  useEffect(() => {
    handleGetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validasi form
  const validate = () => {
    const newErrors = {};
    if (!formData.lokasi.trim()) newErrors.lokasi = "Lokasi wajib diisi";
    if (!formData.jenis) newErrors.jenis = "Kategori sampah wajib dipilih";
    if (!formData.foto) newErrors.foto = "Foto sampah wajib diunggah";
    if (!formData.jadwalId && formData.jadwalId !== 0 && formData.jadwalId !== "0") {
      newErrors.jadwal = "Jadwal wajib dipilih";
    }
    return newErrors;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      // Scroll to first error
      const firstErrorField = document.querySelector('.error-field');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Anda harus login terlebih dahulu');
      return;
    }

    setLoading(true);

    const data = new FormData();

    let finalUserId = userId;
    if (!finalUserId && user?.user_id) {
      finalUserId = user.user_id;
    }
    if (!finalUserId) {
      finalUserId = localStorage.getItem('id_user') || 1;
    }

    const selectedIndex = parseInt(formData.jadwalId);
    const selectedSchedule = jadwalList[selectedIndex];
    const scheduleId = selectedSchedule?.jadwal_penyetoran_id;

    data.append("user_id", finalUserId);
    data.append("jadwal_penyetoran_id", scheduleId);
    data.append("nama_lengkap", formData.nama || user?.nama || "User");
    data.append("no_hp", formData.noHp || user?.no_hp || "-");
    data.append("titik_lokasi", formData.lokasi);
    
    // Get kategori label
    const kategori = KATEGORI_SAMPAH.find(k => k.id === formData.jenis);
    data.append("jenis_sampah", kategori?.label || formData.jenis);

    if (formData.foto) {
      data.append("foto_sampah", formData.foto);
    }

    try {
      // Upload with timeout protection (30 seconds for large files)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${API_BASE_URL}/tabung-sampah`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it automatically for FormData
        },
        body: data,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          const backendErrors = {};
          Object.keys(result.errors).forEach(key => {
            backendErrors[key] = result.errors[key][0];
          });
          setErrors(backendErrors);
          
          // Show specific error for file size
          if (backendErrors.foto_sampah) {
            throw new Error(backendErrors.foto_sampah);
          }
          throw new Error(result.message || "Validasi gagal");
        }
        
        // Handle specific HTTP errors
        if (res.status === 413) {
          throw new Error("Ukuran file terlalu besar untuk server. Coba kompres foto atau gunakan foto dengan ukuran lebih kecil.");
        }
        
        throw new Error(result.message || "Terjadi kesalahan");
      }

      if (result.status === "success") {
        alert("✅ " + (result.message || "Penjemputan sampah berhasil diajukan!"));
        onClose();
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        alert("❌ Upload timeout. Coba lagi atau gunakan foto dengan ukuran lebih kecil.");
      } else {
        alert("❌ " + (err.message || "Gagal mengirim data"));
      }
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format jadwal display
  const formatJadwalDisplay = (jadwal) => {
    if (!jadwal) return null;
    
    const timeStart = jadwal.waktu_mulai?.substring(0, 5) || '00:00';
    const timeEnd = jadwal.waktu_selesai?.substring(0, 5) || '00:00';
    
    return {
      hari: jadwal.hari || jadwal.tanggal || '-',
      waktu: `${timeStart} - ${timeEnd}`,
      lokasi: jadwal.lokasi || '-'
    };
  };

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="form-header">
          <h2>Ajukan Penjemputan Sampah</h2>
          <p>Lengkapi data berikut untuk mengajukan penjemputan</p>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          {/* Section: Jadwal */}
          <div className={`form-section ${errors.jadwal ? 'error-field' : ''}`}>
            <label className="section-label">
              <Calendar size={18} />
              <span>Pilih Jadwal Penjemputan</span>
            </label>
            
            <div className="jadwal-selector">
              <button
                type="button"
                className={`jadwal-trigger ${selectedJadwal ? 'selected' : ''}`}
                onClick={() => setShowJadwalDropdown(!showJadwalDropdown)}
              >
                {selectedJadwal ? (
                  <div className="jadwal-selected">
                    <div className="jadwal-info">
                      <span className="jadwal-hari">{formatJadwalDisplay(selectedJadwal)?.hari}</span>
                      <span className="jadwal-detail">
                        <Clock size={14} /> {formatJadwalDisplay(selectedJadwal)?.waktu}
                      </span>
                      <span className="jadwal-detail">
                        <MapPin size={14} /> {formatJadwalDisplay(selectedJadwal)?.lokasi}
                      </span>
                    </div>
                    <Check size={18} className="check-icon" />
                  </div>
                ) : (
                  <span className="placeholder">Pilih jadwal penjemputan...</span>
                )}
                <ChevronDown size={18} className={`chevron ${showJadwalDropdown ? 'open' : ''}`} />
              </button>

              {showJadwalDropdown && (
                <div className="jadwal-dropdown">
                  {jadwalList.length === 0 ? (
                    <div className="jadwal-empty">Tidak ada jadwal tersedia</div>
                  ) : (
                    jadwalList.map((jadwal, index) => {
                      const display = formatJadwalDisplay(jadwal);
                      const isSelected = selectedJadwal?.jadwal_penyetoran_id === jadwal.jadwal_penyetoran_id;
                      
                      return (
                        <div
                          key={jadwal.jadwal_penyetoran_id || index}
                          className={`jadwal-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleJadwalSelect(jadwal, index)}
                        >
                          <div className="jadwal-option-content">
                            <span className="jadwal-hari">{display?.hari}</span>
                            <span className="jadwal-meta">
                              <Clock size={12} /> {display?.waktu}
                            </span>
                            <span className="jadwal-meta">
                              <MapPin size={12} /> {display?.lokasi}
                            </span>
                          </div>
                          {isSelected && <Check size={16} className="check-icon" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {errors.jadwal && <span className="error-text">{errors.jadwal}</span>}
          </div>

          {/* Section: Lokasi */}
          <div className={`form-section ${errors.lokasi ? 'error-field' : ''}`}>
            <label className="section-label">
              <MapPin size={18} />
              <span>Lokasi Penjemputan</span>
            </label>

            {/* Info Box */}
            <div className="location-info-box">
              <Navigation size={16} />
              <p>Form ini akan otomatis mengambil lokasi dari perangkat Anda. Cukup setujui situs untuk mengetahui lokasi Anda.</p>
            </div>

            {/* Location Input */}
            <div className="location-input-wrapper">
              <input
                type="text"
                className="location-input"
                value={formData.lokasi}
                onChange={(e) => setFormData(prev => ({ ...prev, lokasi: e.target.value }))}
                placeholder="Lokasi akan terisi otomatis..."
                readOnly={gettingLocation}
              />
              {formData.lokasi && (
                <div className="location-status success">
                  <Check size={16} />
                </div>
              )}
              {gettingLocation && (
                <div className="location-status loading">
                  <span className="spinner-small"></span>
                </div>
              )}
            </div>

            {/* Koordinat Display */}
            {formData.koordinat.lat && formData.koordinat.lng && (
              <div className="koordinat-display">
                <MapPin size={14} />
                <span>Koordinat: {formData.koordinat.lat.toFixed(6)}, {formData.koordinat.lng.toFixed(6)}</span>
              </div>
            )}

            {/* Retry Button - only show if location failed */}
            {!formData.lokasi && !gettingLocation && (
              <button
                type="button"
                className="location-retry-btn"
                onClick={handleGetLocation}
              >
                <Navigation size={16} />
                <span>Coba Ambil Lokasi Lagi</span>
              </button>
            )}
            
            {errors.lokasi && <span className="error-text">{errors.lokasi}</span>}
          </div>

          {/* Section: Kategori Sampah */}
          <div className={`form-section ${errors.jenis ? 'error-field' : ''}`}>
            <label className="section-label">
              <Package size={18} />
              <span>Kategori Sampah</span>
            </label>

            <div className="kategori-grid">
              {KATEGORI_SAMPAH.map((kategori) => {
                const Icon = kategori.icon;
                const isSelected = formData.jenis === kategori.id;
                
                return (
                  <button
                    key={kategori.id}
                    type="button"
                    className={`kategori-item ${isSelected ? 'selected' : ''}`}
                    style={{ 
                      '--kategori-color': kategori.color,
                      borderColor: isSelected ? kategori.color : undefined 
                    }}
                    onClick={() => handleKategoriSelect(kategori.id)}
                  >
                    <div className="kategori-icon" style={{ color: kategori.color }}>
                      <Icon size={22} />
                    </div>
                    <span className="kategori-label">{kategori.label}</span>
                    {isSelected && (
                      <div className="kategori-check" style={{ backgroundColor: kategori.color }}>
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.jenis && <span className="error-text">{errors.jenis}</span>}
          </div>

          {/* Section: Foto Sampah */}
          <div className={`form-section ${errors.foto ? 'error-field' : ''}`}>
            <label className="section-label">
              <ImageIcon size={18} />
              <span>Foto Sampah</span>
            </label>

            {fotoPreview ? (
              <div className="foto-preview-container">
                <img src={fotoPreview} alt="Preview" className="foto-preview" />
                <div className="foto-info">
                  <span className="foto-name">{formData.foto?.name}</span>
                  <span className="foto-size">
                    {(formData.foto?.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button 
                  type="button" 
                  className="foto-remove"
                  onClick={handleRemoveFoto}
                  aria-label="Hapus foto"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <label className="foto-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="foto-input"
                />
                <div className="foto-upload-content">
                  <ImageIcon size={32} />
                  <span className="foto-upload-text">Klik untuk upload foto</span>
                  <span className="foto-upload-hint">JPG, PNG (Maks. 5MB)</span>
                </div>
              </label>
            )}
            {errors.foto && <span className="error-text">{errors.foto}</span>}
          </div>

          {/* Note */}
          <div className="form-note">
            <span>📦</span>
            <p>Berat minimum sampah adalah <strong>3 Kg</strong> untuk penjemputan.</p>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Ajukan Penjemputan</span>
                </>
              )}
            </button>
            <button 
              type="button" 
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
