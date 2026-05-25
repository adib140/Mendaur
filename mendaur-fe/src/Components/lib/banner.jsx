import { useEffect } from "react";
import "./banner.css";

const Banner = () => {
  useEffect(() => {}, []);

  return (
    <div className="bannerCard">
        <div className="bannerContent">
          <span className="bannerBadge">🌱 Program Baru</span>
          <h1 className="bannerTitle">
            Wujudkan Indonesia Hijau Bersama Mendaur
          </h1>
          <p className="bannerText">
            Bergabunglah dalam misi mengurangi sampah dan menciptakan lingkungan yang lebih bersih untuk generasi mendatang.
          </p>
        </div>
    </div>
);
};

export default Banner;
