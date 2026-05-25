import {useEffect} from "react";
import './about.css'
import feather from 'feather-icons'

function About () {
    useEffect(() => {
        feather.replace();
    }, []);

    return(
    <section className="about">
        <div className="wrapAbout">
            {/* Siapa Kami */}
            <div className="boxSiapaKami" aria-label="box-tinjau">
                <h2 className="siapaKami">Siapa Kami?</h2>
                <p className="tagAbout">Pellentesque ultricies quam tortor, nec condimentum dui bibendum sit amet.</p>
                <img src="/src/assets/tumbuh.jpg" alt="Visual Siapa Kami" className="visualImg" />
            </div>

            <div className="misi">

            </div>

            {/* Kegiatan */}
            {/* <div className="boxKegiatan" aria-label="box-tinjau">
                <h1 className="kegiatan">Kegiatan Kami</h1>
                <img src="/src/assets/harilingkungan.jpg" alt="Visual Siapa Kami" className="visualImg" />
            </div> */}

        </div>
    </section>
    )
}
export default About;
