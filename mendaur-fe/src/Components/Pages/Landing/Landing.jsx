import React from "react";
import './Landing.css'; //Perbaiki CSS sesuaikan
import Header from "./Header"
import Hero from "./Hero"


function Landing () {
    return (
        <div className="landing">
            <Header />
            <Hero />
            {/* <About /> */}
        </div>
    )
}
export default Landing;
