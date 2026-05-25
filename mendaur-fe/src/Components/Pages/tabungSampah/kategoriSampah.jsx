import React from "react";
import { KategoriSampah } from "../../lib/jenisSampah";
import "./kategoriSampah.css";

export default function KategoriSampahWrapper({ selectedKategori, setSelectedKategori, onSelectionChange }) {
  const handleCategoryClick = (kategoriId, kategoriLabel) => {
    const newSelection = selectedKategori === kategoriId ? null : kategoriId;
    setSelectedKategori(newSelection);

    // ✅ Notify parent component of selection change
    if (onSelectionChange) {
      onSelectionChange(newSelection, kategoriLabel);
    }
  };

  return (
    <div className="kategoriContainer">
      <p>Kategori Sampah</p>
      <div className="kategoriWrapper">
        {KategoriSampah.map((kategori) => {
          const IconComponent = kategori.icon;

          return (
            <div
              key={kategori.id}
              className={`kategoriCard ${selectedKategori === kategori.id ? "active" : ""}`}
              style={{ borderColor: kategori.color }}
              onClick={() => handleCategoryClick(kategori.id, kategori.label)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCategoryClick(kategori.id, kategori.label);
                }
              }}
              title={`Klik untuk memilih kategori ${kategori.label}`}
            >
              <div className="kategoriIcon" style={{ color: kategori.color }}>
                <IconComponent size={20} strokeWidth={1} />
              </div>
              <div className="kategoriLabel" style={{ color: kategori.color }}>
                {kategori.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
