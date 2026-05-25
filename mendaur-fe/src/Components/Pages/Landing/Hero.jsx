import React from "react";
import './Hero.css'
import { Banknote, ArrowRight, Info } from "lucide-react";

function Hero() {
    return (
        <section className="hero">
            <div className="heroContainer">
                {/* Badge
                <div className="heroBadge">
                    <Banknote size={20} className="badgeIcon" />
                    <span className="badgeText">Platform Digital Terdepan</span>
                </div> */}

                {/* Hero Title */}
                <h1 className="heroTitle">
                    Mendaur
                    <br />
                    <span className="heroTitleAccent">INDUK NUSA</span>
                </h1>

                {/* Hero Subtitle */}
                <p className="heroSubtitle">
                    Platform digital yang memungkinkan Anda menabung sampah layaknya menabung uang.
                    Tukar sampah Anda dengan poin dan dapatkan nilai ekonomis dari limbah.
                </p>

                {/* Action Buttons */}
                <div className="heroButtonsGroup">
                    <button className="btnMulai">
                        Mulai Menabung
                        <ArrowRight size={20} className="btnIcon" />
                    </button>
                    <button className="btnInfo">
                        <Info size={20} className="btnIcon" />
                        Cara Kerja
                    </button>
                </div>

                {/* Stats Card */}
                <div className="statsCard">
                    <div className="statsItem">
                        <div className="statsNumber">50K+</div>
                        <div className="statsLabel">Nasabah Aktif</div>
                    </div>
                    <div className="statsItem">
                        <div className="statsNumber statsHighlight">2.5M</div>
                        <div className="statsLabel">Kg Sampah Terkumpul</div>
                    </div>
                    <div className="statsItem">
                        <div className="statsNumber statsGreen">₹1.2M</div>
                        <div className="statsLabel">Total Tabungan</div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero;

