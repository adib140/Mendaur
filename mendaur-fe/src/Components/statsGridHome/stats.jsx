import React from "react";
import "./stats.css"
import {
    Recycle,
    TrendingUp,
    Users,
    Award,
} from "lucide-react";

const stats = [
  {
    title: "Total Sampah Dikumpulkan",
    value: "2.5 Ton",
    icon: Recycle,
    color: "text-primary",
    bg: "bg-primary-light",
  },
  {
    title: "Poin Terkumpul",
    value: "15,240",
    icon: TrendingUp,
    color: "text-accent",
    bg: "bg-accent-light",
  },
  {
    title: "Anggota Komunitas",
    value: "1,847",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary-light",
  },
  {
    title: "Pencapaian Bulan Ini",
    value: "Ranking 8",
    icon: Award,
    color: "text-accent",
    bg: "bg-accent-light",
  },
];

const StatsGrid = () => {
  return (
    <div className="statsGrid">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="statCard">
            <div className="statContent">
              <div className={`iconBox ${stat.bg}`}>
                <Icon className={`statIcon ${stat.color}`} />
              </div>
              <div className="statText">
                <p className="statTitle">{stat.title}</p>
                <p className="statValue">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
