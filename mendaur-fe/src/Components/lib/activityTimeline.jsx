import React, { useState } from "react";
import { Trash2, Gift, Target, CheckCircle, Medal } from "lucide-react";
import { logAktivitas } from "./logAktivitas"; // pastikan path sesuai

export default function ActivityTimeline() {
  const [filter, setFilter] = useState("all");

  const iconMap = {
    penyetoran: <Trash2 size={20} />,
    penukaran: <Gift size={20} />,
    partisipasi: <Target size={20} />,
    penyelesaian: <CheckCircle size={20} />,
    badge: <Medal size={20} />,
    default: <CheckCircle size={20} />,
  };

  const sortedAktivitas = [...logAktivitas].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const filteredAktivitas = sortedAktivitas.filter(item =>
    filter === "all" ? true : item.kategori === filter
  );

  return (
    <div className="activityTimeline">
      <h3 className="sectionTitle">Aktivitas Terakhir</h3>

      <div className="timelineFilter">
        {["all", "penyetoran", "penukaran", "partisipasi", "penyelesaian", "badge"].map(type => (
          <button
            key={type}
            className={filter === type ? "active" : ""}
            onClick={() => setFilter(type)}
          >
            {type === "all" ? "Semua" : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <ul className="timelineList">
        {filteredAktivitas.map((item, index) => {
          const icon = iconMap[item.kategori] || iconMap.default;
          return (
            <li key={index} className="timelineItem">
              <div className={`timelineIcon ${item.kategori}`}>
                {React.cloneElement(icon, {
                  className: `icon ${item.kategori}`,
                })}
              </div>
              <div className="timelineContent">
                <p className="timelineDesc">{item.deskripsi}</p>
                <span className="timelineDetail">{item.detail}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
