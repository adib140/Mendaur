import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, User, Phone, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "../../../config/api";
import "./register.css";

export default function Register() {
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    no_hp: "",
    password: "",
    password_confirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Validation states
  const [errors, setErrors] = useState({});

  // Validation rules
  const validateForm = () => {
    const newErrors = {};

    // Nama validation
    if (!formData.nama.trim()) {
      newErrors.nama = "Nama lengkap wajib diisi";
    } else if (formData.nama.trim().length < 3) {
      newErrors.nama = "Nama minimal 3 karakter";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    // Phone validation
    if (!formData.no_hp.trim()) {
      newErrors.no_hp = "Nomor HP wajib diisi";
    } else if (!/^(\+62|0)[0-9]{9,12}$/.test(formData.no_hp.replace(/\s/g, ""))) {
      newErrors.no_hp = "Format nomor HP tidak valid (08xx atau +62xx)";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }

    // Password confirm validation
    if (!formData.password_confirm) {
      newErrors.password_confirm = "Konfirmasi password wajib diisi";
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = "Password tidak cocok";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('0')) {
      value = '0' + value.slice(1);
    } else if (value.startsWith('62')) {
      value = '+' + value;
    }
    
    setFormData(prev => ({
      ...prev,
      no_hp: value
    }));
    
    if (errors.no_hp) {
      setErrors(prev => ({
        ...prev,
        no_hp: ""
      }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nama: formData.nama.trim(),
        email: formData.email.trim(),
        no_hp: formData.no_hp.replace(/\s/g, ''),
        password: formData.password,
        password_confirmation: formData.password_confirm,
      };

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",  // ⚠️ WAJIB untuk Safari/iOS
        mode: "cors",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Handle 422 Validation Error
      if (response.status === 422) {
        if (result.errors) {
          const backendErrors = Object.entries(result.errors).reduce((acc, [key, messages]) => {
            acc[key] = Array.isArray(messages) ? messages[0] : messages;
            return acc;
          }, {});
          setErrors(backendErrors);
          
          // Show first error as main message
          const firstError = Object.values(backendErrors)[0];
          setErrorMsg(firstError || "Validasi gagal. Silakan periksa data Anda.");
          return;
        }
        setErrorMsg(result.message || "Data tidak valid. Silakan periksa kembali.");
        return;
      }

      // Handle specific HTTP status codes
      if (response.status === 500) {
        // Database/Server error - check for duplicate entries
        const errorMessage = result.message || "";
        
        if (errorMessage.includes("Duplicate entry") && errorMessage.includes("email")) {
          setErrors(prev => ({ ...prev, email: "Email sudah terdaftar" }));
          setErrorMsg("Email sudah digunakan. Silakan gunakan email lain.");
          return;
        }
        
        if (errorMessage.includes("Duplicate entry") && errorMessage.includes("no_hp")) {
          setErrors(prev => ({ ...prev, no_hp: "Nomor HP sudah terdaftar" }));
          setErrorMsg("Nomor HP sudah digunakan. Silakan gunakan nomor lain.");
          return;
        }
        
        // Generic server error
        setErrorMsg("Terjadi kesalahan server. Silakan coba lagi nanti.");
        return;
      }

      if (!response.ok) {
        if (result.errors) {
          const backendErrors = Object.entries(result.errors).reduce((acc, [key, messages]) => {
            acc[key] = Array.isArray(messages) ? messages[0] : messages;
            return acc;
          }, {});
          setErrors(backendErrors);
          setErrorMsg("Validasi gagal. Silakan periksa data Anda.");
          return;
        }
        setErrorMsg(result.message || "Pendaftaran gagal");
        return;
      }

      if (result.status === "success") {
        setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke halaman login...");
        
        setFormData({
          nama: "",
          email: "",
          no_hp: "",
          password: "",
          password_confirm: "",
        });
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErrorMsg(result.message || "Pendaftaran gagal");
      }
    } catch (error) {
      console.error("Register error:", error);
      setErrorMsg(error.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!formData.password) return 0;
    
    let strength = 0;
    if (formData.password.length >= 8) strength++;
    if (/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password)) strength++;
    if (/\d/.test(formData.password)) strength++;
    if (/[!@#$%^&*]/.test(formData.password)) strength++;

    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const getStrengthLabel = (strength) => {
    if (strength === 0) return "";
    if (strength === 1) return "Lemah";
    if (strength === 2) return "Sedang";
    if (strength === 3) return "Kuat";
    return "Sangat Kuat";
  };

  const getStrengthColor = (strength) => {
    if (strength === 0) return "#e5e7eb";
    if (strength === 1) return "#ef4444";
    if (strength === 2) return "#f59e0b";
    if (strength === 3) return "#22c55e";
    return "#059669";
  };

  return (
    <div className="registerPageWrapper">
      {/* Back Button */}
      <button
        className="backButton"
        onClick={() => navigate("/landing")}
        aria-label="Kembali"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="registerContainer">
        {/* Logo & Header */}
        <div className="registerHeader">
          <div className="logoIcon">
            <img src="/assets/ecoTreasure_logo.png" alt="EcoTreasure Logo" className="logoImage" />
          </div>
          <h1 className="formTitle">Daftar ke Mendaur</h1>
          <p className="formSubtitle">Mulai perjalanan sustainability Anda</p>
        </div>

        <form className="registerForm" onSubmit={handleRegister}>
          {/* Nama Lengkap */}
          <div className="formGroup">
            <label className="inputLabel">Nama Lengkap</label>
            <div className="inputWrap">
              <div className="iconWrapper">
                <User className="inputIcon" size={20} />
              </div>
              <div className="inputFieldWrapper">
                <input
                  type="text"
                  name="nama"
                  placeholder="Masukkan nama lengkap"
                  className={`inputField ${errors.nama ? "inputError" : ""}`}
                  value={formData.nama}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            </div>
            {errors.nama && (
              <span className="fieldError">
                <AlertCircle size={14} />
                {errors.nama}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="formGroup">
            <label className="inputLabel">Email</label>
            <div className="inputWrap">
              <div className="iconWrapper">
                <Mail className="inputIcon" size={20} />
              </div>
              <div className="inputFieldWrapper">
                <input
                  type="email"
                  name="email"
                  placeholder="nama@email.com"
                  className={`inputField ${errors.email ? "inputError" : ""}`}
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>
            {errors.email && (
              <span className="fieldError">
                <AlertCircle size={14} />
                {errors.email}
              </span>
            )}
          </div>

          {/* Nomor HP */}
          <div className="formGroup">
            <label className="inputLabel">Nomor HP</label>
            <div className="inputWrap">
              <div className="iconWrapper">
                <Phone className="inputIcon" size={20} />
              </div>
              <div className="inputFieldWrapper">
                <input
                  type="tel"
                  name="no_hp"
                  placeholder="08xx xxxx xxxx"
                  className={`inputField ${errors.no_hp ? "inputError" : ""}`}
                  value={formData.no_hp}
                  onChange={handlePhoneChange}
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
            </div>
            {errors.no_hp && (
              <span className="fieldError">
                <AlertCircle size={14} />
                {errors.no_hp}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="formGroup">
            <label className="inputLabel">Kata Sandi</label>
            <div className="inputWrap">
              <div className="iconWrapper">
                <Lock className="inputIcon" size={20} />
              </div>
              <div className="inputFieldWrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimal 8 karakter"
                  className={`inputField ${errors.password ? "inputError" : ""}`}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="button"
                className="togglePassword"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <span className="fieldError">
                <AlertCircle size={14} />
                {errors.password}
              </span>
            )}
            {formData.password && (
              <div className="passwordStrength">
                <div className="strengthBars">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="strengthBar"
                      style={{
                        backgroundColor: passwordStrength >= level ? getStrengthColor(passwordStrength) : "#e5e7eb"
                      }}
                    />
                  ))}
                </div>
                <span className="strengthLabel" style={{ color: getStrengthColor(passwordStrength) }}>
                  {getStrengthLabel(passwordStrength)}
                </span>
              </div>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div className="formGroup">
            <label className="inputLabel">Konfirmasi Kata Sandi</label>
            <div className="inputWrap">
              <div className="iconWrapper">
                <Lock className="inputIcon" size={20} />
              </div>
              <div className="inputFieldWrapper">
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  name="password_confirm"
                  placeholder="Ulangi kata sandi"
                  className={`inputField ${errors.password_confirm ? "inputError" : ""}`}
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="button"
                className="togglePassword"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                aria-label={showPasswordConfirm ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {formData.password_confirm && formData.password === formData.password_confirm && !errors.password_confirm && (
                <CheckCircle size={18} className="matchIcon" />
              )}
            </div>
            {errors.password_confirm && (
              <span className="fieldError">
                <AlertCircle size={14} />
                {errors.password_confirm}
              </span>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="errorAlert">
              <AlertCircle size={18} />
              <p className="errorText">{errorMsg}</p>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="successAlert">
              <CheckCircle size={18} />
              <p className="successText">{successMsg}</p>
            </div>
          )}

          {/* Terms */}
          <p className="termsText">
            Dengan mendaftar, Anda menyetujui{" "}
            <Link to="/terms" className="termsLink">Syarat & Ketentuan</Link> dan{" "}
            <Link to="/privacy" className="termsLink">Kebijakan Privasi</Link>
          </p>

          {/* Register Button */}
          <button
            type="submit"
            className="registerBtn"
            disabled={loading}
          >
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>

          {/* Login Link */}
          <p className="loginText">
            Sudah punya akun?{" "}
            <Link to="/login" className="loginLink">Masuk di sini</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
