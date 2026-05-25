import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../../../config/api";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const loginUrl = `${API_BASE_URL}/login`;
      
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",  // ⚠️ WAJIB untuk Safari/iOS
        mode: "cors",
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        // Try to parse as JSON, but handle HTML responses
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          throw new Error(result.message || "Login gagal");
        } else {
          throw new Error("Server mengembalikan response yang tidak valid. Periksa backend API.");
        }
      }

      const result = await response.json();

      if (result.status === "success") {
        // Extract login response
        const loginData = result.data;
        const userData = loginData.user;

        // Get role from backend response (either as string or object)
        const userRole = userData.role?.nama_role || userData.role || 'nasabah';

        // Use context login method (passes entire response)
        login(loginData);

        // Role-based navigation
        if (userRole === 'admin' || userRole === 'superadmin') {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        setErrorMsg(result.message || "Email atau password salah.");
      }
    } catch (error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("ERR_CONNECTION_REFUSED")) {
        setErrorMsg("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
      } else {
        setErrorMsg(error.message || "Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPageWrapper">
      {/* Back Button */}
      <button
        className="backButton"
        onClick={() => navigate("/landing")}
        aria-label="Kembali"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="loginContainer">
        {/* Logo & Header */}
        <div className="loginHeader">
          <div className="logoIcon">
            <img src="/assets/ecoTreasure_logo.png" alt="EcoTreasure Logo" className="logoImage" />
          </div>
          <h1 className="formTitle">Masuk ke Mendaur</h1>
          <p className="formSubtitle">Lanjutkan perjalanan sustainability Anda</p>
        </div>

        <form className="loginForm" onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="formGroup">
            <label className="inputLabel">Email</label>
            <div className="inputWrap">
                <div className="iconWrapper">
                    <Mail className="inputIcon" size={20} />
                </div>
                <div className="inputFieldWrapper">
                    <input
                    className="inputField"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                    />
                </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="formGroup">
            <label className="inputLabel">Kata Sandi</label>
            <div className="inputWrap">
                <div className="iconWrapper">
                    <Lock className="inputIcon" size={20} />
                </div>
                <div className="inputFieldWrapper">
                    <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
                    className="inputField"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    />
                </div>
                <button
                    type="button"
                    className="togglePassword"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                    {showPassword ? (
                    <EyeOff size={20} />
                    ) : (
                    <Eye size={20} />
                    )}
                </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="errorAlert">
              <p className="errorText">{errorMsg}</p>
            </div>
          )}

          {/* Links Row */}
          <div className="linksRow">
            <a href="#" className="forgotLink">Ingat saya</a>
            <a href="/forgot-password" className="forgotLink">Lupa kata sandi?</a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="loginBtn"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          {/* Register Link */}
          <div className="registerLinkContainer">
            <span className="registerText">Belum punya akun?</span>
            <a href="/register" className="registerLink">Daftar di sini</a>
          </div>
        </form>
      </div>
    </div>
  );
}
