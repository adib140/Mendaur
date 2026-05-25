import React from "react";
import {useEffect} from "react";
import feather from "feather-icons";
import "./daftar.css"



function Daftar () {
        useEffect(() => {
        feather.replace();
    }, []);
    return (
        <div className="signupContainer">
            <h2 className="formTitle">Daftar</h2>
            <form action="#" className="signupForm">

                <div className="infoPribadi">
                    <h3 className="sectionTitle">Informasi Pribadi</h3>

                    <div className="inputWrap">
                        {/* <p>Nama Lengkap</p> */}
                        <input type="text" placeholder="Masukkan nama lengkap Anda" className="inputField" required/>
                        <i data-feather="user" className="inputIcon"></i>
                    </div>
                    
                    <div className="inputWrap">
                        {/* <p>Email</p> */}
                        <input type="email" placeholder="@email.com" className="inputField" required/>
                        <i data-feather="mail" className="inputIcon"></i>
                    </div>

                    <div className="inputWrap">
                        {/* <p>Kontak</p> */}
                        <input type="tel" placeholder="Masukkan nomor telepon Anda" className="inputField" required/>
                        <i data-feather="phone" className="inputIcon"></i>
                    </div>
                </div>
                
                
                <div className="infoAlamat"> 
                    <h3 className="sectionTitle">Informasi Alamat</h3>
                    <div className="inputWrap">
                        {/* <p>Alamat Lengkap</p> */}
                        <input type="text" placeholder="Alamat" className="inputField" required/>
                        <i data-feather="map-pin" className="inputIcon"></i>
                    </div>
                </div>

                <div className="keamananAkun">
                    <h3 className="sectionTitle">Keamanan Akun</h3>
                    <div className="inputWrap">
                        <input type="password" placeholder="Password" className="inputField"/>
                        <i data-feather="lock" className="inputIcon"></i> 
                    </div>

                    <div className="inputWrap">
                        <input type="password" placeholder="Konfirmasi Password" className="inputField"/>
                        <i data-feather="lock" className="inputIcon"></i>
                    </div>
                </div>


                <button className="signUpBtn">Sign Up</button>
                <p className="signText">Sudah punya akun? <a href="/" className="signLink">Masuk</a></p>
            </form>
        </div>
    )
}

export default Daftar;
        
