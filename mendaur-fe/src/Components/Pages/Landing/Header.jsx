import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import feather from 'feather-icons'
import './Header.css'

function Navbar () {
    const navigate = useNavigate();
    
    useEffect(() => {
        feather.replace();
    }, []);
    
    return (
        <header className="header" >
            <h1 className="headerTitle">BSI Nusa</h1>
            <div className="navbar">
                <nav className="navLinks">
                    <img src="" alt="" />
                    <a href="/">Produk</a>
                    <a href="/">Tabung Sampah</a>
                    {/* <a href="/">Kegiatan</a>
                    <a href="/">Komunitas</a> */}
                </nav>
            </div>
            
            <div className="navBtn">
                <button className="btnMasuk" onClick={() => navigate('/login')}>
                    Masuk
                    <i data-feather="user" className="masukIcon"></i>
                </button>
                
                <button className="btnDaftar" onClick={() => navigate('/register')}>Daftar</button>
            </div>

        </header>
       
    )
}

export default Navbar;