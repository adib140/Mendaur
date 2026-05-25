import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, FileText, AlertCircle, Loader } from "lucide-react";
import { API_BASE_URL } from "../../../config/api";
import "./BookingModal.css";

const BookingModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tanggal: "",
    waktu_mulai: "",
    waktu_selesai: "",
    lokasi: "",
    catatan: "",
    hari: "",
  });

  const [savedLocations, setSavedLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Load saved locations from localStorage
  useEffect(() => {
    const locations = JSON.parse(localStorage.getItem("savedLocations") || "[]");
    setSavedLocations(locations);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLocationSelect = (e) => {
    const locationId = e.target.value;
    if (locationId) {
      const location = savedLocations.find((loc) => loc.id === parseInt(locationId));
      if (location) {
        setFormData((prev) => ({ ...prev, lokasi: location.address }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tanggal && !formData.hari) {
      newErrors.tanggal = "Tanggal atau hari wajib dipilih";
    }

    if (!formData.waktu_mulai) {
      newErrors.waktu_mulai = "Waktu mulai wajib diisi";
    }

    if (!formData.waktu_selesai) {
      newErrors.waktu_selesai = "Waktu selesai wajib diisi";
    }

    if (formData.waktu_mulai && formData.waktu_selesai && formData.waktu_mulai >= formData.waktu_selesai) {
      newErrors.waktu_selesai = "Waktu selesai harus lebih besar dari waktu mulai";
    }

    if (!formData.lokasi || formData.lokasi.trim().length < 5) {
      newErrors.lokasi = "Lokasi wajib diisi (minimal 5 karakter)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("id_user");

      if (!token || !userId) {
        throw new Error("Authentication required");
      }

      // Format jam field for backend
      const jam = `${formData.waktu_mulai} - ${formData.waktu_selesai}`;

      const payload = {
        user_id: parseInt(userId),
        hari: formData.hari || new Date(formData.tanggal).toLocaleDateString("id-ID", { weekday: "long" }),
        tanggal: formData.tanggal || null,
        jam: jam,
        waktu_mulai: formData.waktu_mulai,
        waktu_selesai: formData.waktu_selesai,
        lokasi: formData.lokasi,
        alamat: formData.lokasi,
        catatan: formData.catatan || null,
        status: "pending",
      };

      const response = await fetch(`${API_BASE_URL}/jadwal-penyetoran`, {
        method: "POST",
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal membuat jadwal");
      }

      // Success
      alert("✅ Jadwal berhasil dibuat!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>
            <Calendar size={24} />
            Jadwalkan Pengambilan Sampah
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Date Selection */}
          <div className="form-row">
            <div className="form-group">
              <label>
                <Calendar size={16} />
                Pilih Tanggal
              </label>
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                min={today}
                className={errors.tanggal ? "error" : ""}
              />
              {errors.tanggal && <span className="error-text">{errors.tanggal}</span>}
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                Atau Pilih Hari (Rutin)
              </label>
              <select
                name="hari"
                value={formData.hari}
                onChange={handleChange}
                className={errors.tanggal ? "error" : ""}
              >
                <option value="">-- Pilih Hari --</option>
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </select>
            </div>
          </div>

          {/* Time Selection */}
          <div className="form-row">
            <div className="form-group">
              <label>
                <Clock size={16} />
                Waktu Mulai*
              </label>
              <input
                type="time"
                name="waktu_mulai"
                value={formData.waktu_mulai}
                onChange={handleChange}
                required
                className={errors.waktu_mulai ? "error" : ""}
              />
              {errors.waktu_mulai && <span className="error-text">{errors.waktu_mulai}</span>}
            </div>

            <div className="form-group">
              <label>
                <Clock size={16} />
                Waktu Selesai*
              </label>
              <input
                type="time"
                name="waktu_selesai"
                value={formData.waktu_selesai}
                onChange={handleChange}
                required
                className={errors.waktu_selesai ? "error" : ""}
              />
              {errors.waktu_selesai && <span className="error-text">{errors.waktu_selesai}</span>}
            </div>
          </div>

          {/* Location Selection */}
          {savedLocations.length > 0 && (
            <div className="form-group">
              <label>
                <MapPin size={16} />
                Pilih dari Lokasi Tersimpan
              </label>
              <select onChange={handleLocationSelect}>
                <option value="">-- Pilih Lokasi --</option>
                {savedLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} - {loc.address}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>
              <MapPin size={16} />
              Alamat Lokasi Pengambilan*
            </label>
            <textarea
              name="lokasi"
              value={formData.lokasi}
              onChange={handleChange}
              placeholder="Masukkan alamat lengkap..."
              rows="3"
              required
              className={errors.lokasi ? "error" : ""}
            />
            {errors.lokasi && <span className="error-text">{errors.lokasi}</span>}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>
              <FileText size={16} />
              Catatan (Opsional)
            </label>
            <textarea
              name="catatan"
              value={formData.catatan}
              onChange={handleChange}
              placeholder="Tambahkan catatan khusus..."
              rows="2"
            />
          </div>

          {/* Info Box */}
          <div className="info-box">
            <AlertCircle size={16} />
            <div>
              <strong>Catatan:</strong>
              <p>
                Jadwal akan dikonfirmasi oleh admin. Anda akan menerima notifikasi setelah
                jadwal disetujui.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="spinner" size={16} />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  Buat Jadwal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
