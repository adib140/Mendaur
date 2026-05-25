import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footerContent">
        <p className="footerBrand">© 2025 Mendaur. Semua hak dilindungi.</p>
        <div className="footerLinks">
          <a href="/tentang" className="footerLink">Tentang Kami</a>
          <a href="/kontak" className="footerLink">Kontak</a>
          <a href="/kebijakan" className="footerLink">Kebijakan Privasi</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
