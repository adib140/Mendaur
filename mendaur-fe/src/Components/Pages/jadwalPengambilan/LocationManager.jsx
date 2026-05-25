import React, { useState, useEffect } from "react";
import { X, MapPin, Plus, Edit2, Trash2, Save, AlertCircle } from "lucide-react";
import "./LocationManager.css";

const LocationManager = ({ onClose }) => {
  const [locations, setLocations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  // Load locations from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedLocations") || "[]");
    setLocations(saved);
  }, []);

  // Save locations to localStorage
  const saveToLocalStorage = (updatedLocations) => {
    localStorage.setItem("savedLocations", JSON.stringify(updatedLocations));
    setLocations(updatedLocations);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Nama lokasi minimal 3 karakter";
    }

    if (!formData.address || formData.address.trim().length < 10) {
      newErrors.address = "Alamat minimal 10 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm()) return;

    const newLocation = {
      id: Date.now(),
      name: formData.name,
      address: formData.address,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [...locations, newLocation];
    saveToLocalStorage(updated);
    setFormData({ name: "", address: "", notes: "" });
    setShowAddForm(false);
    setErrors({});
  };

  const handleEdit = (location) => {
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address: location.address,
      notes: location.notes || "",
    });
    setShowAddForm(false);
  };

  const handleUpdate = () => {
    if (!validateForm()) return;

    const updated = locations.map((loc) =>
      loc.id === editingId
        ? { ...loc, name: formData.name, address: formData.address, notes: formData.notes }
        : loc
    );

    saveToLocalStorage(updated);
    setEditingId(null);
    setFormData({ name: "", address: "", notes: "" });
    setErrors({});
  };

  const handleDelete = (id) => {
    if (window.confirm("Yakin ingin menghapus lokasi ini?")) {
      const updated = locations.filter((loc) => loc.id !== id);
      saveToLocalStorage(updated);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: "", address: "", notes: "" });
    setErrors({});
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content location-manager" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            <MapPin size={24} />
            Kelola Lokasi
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Add Button */}
          {!showAddForm && !editingId && (
            <button
              className="btn-add-location"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={18} />
              Tambah Lokasi Baru
            </button>
          )}

          {/* Add/Edit Form */}
          {(showAddForm || editingId) && (
            <div className="location-form">
              <h3>{editingId ? "Edit Lokasi" : "Tambah Lokasi Baru"}</h3>

              <div className="form-group">
                <label>Nama Lokasi*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Misal: Rumah, Kantor, Toko"
                  className={errors.name ? "error" : ""}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Alamat Lengkap*</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Jl. Contoh No.123, Kelurahan, Kecamatan, Kota"
                  rows="3"
                  className={errors.address ? "error" : ""}
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label>Catatan (Opsional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Patokan atau informasi tambahan"
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button className="btn-cancel" onClick={handleCancel}>
                  Batal
                </button>
                <button
                  className="btn-save"
                  onClick={editingId ? handleUpdate : handleAdd}
                >
                  <Save size={16} />
                  {editingId ? "Update" : "Simpan"}
                </button>
              </div>
            </div>
          )}

          {/* Locations List */}
          <div className="locations-list">
            {locations.length === 0 ? (
              <div className="empty-locations">
                <MapPin size={48} />
                <p>Belum ada lokasi tersimpan</p>
                <span>Tambahkan lokasi untuk mempermudah penjadwalan</span>
              </div>
            ) : (
              locations.map((location) => (
                <div
                  key={location.location_id}
                  className={`location-card ${editingId === location.id ? "editing" : ""}`}
                >
                  <div className="location-icon">
                    <MapPin size={20} />
                  </div>
                  <div className="location-info">
                    <h4>{location.name}</h4>
                    <p>{location.address}</p>
                    {location.notes && (
                      <span className="location-notes">
                        <AlertCircle size={14} />
                        {location.notes}
                      </span>
                    )}
                  </div>
                  <div className="location-actions">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleEdit(location)}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(location.id)}
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationManager;
