import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Leaf, AlertCircle, CheckCircle, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "../../../config/api";
import "./forgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Step: 'email' | 'otp' | 'reset' | 'success'
  const [step, setStep] = useState('email');
  
  // Form data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState(""); // Store token from verify OTP response
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Refs for OTP inputs - better for iOS compatibility
  const otpRefs = useRef([]);

  // Initialize refs array
  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, 6);
  }, []);

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!email.trim()) {
      setErrorMsg("Email wajib diisi");
      return;
    }
    
    if (!validateEmail(email)) {
      setErrorMsg("Format email tidak valid");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      // Handle 422 Validation Error
      if (response.status === 422) {
        if (result.errors && result.errors.email) {
          const emailError = Array.isArray(result.errors.email) 
            ? result.errors.email[0] 
            : result.errors.email;
          setErrorMsg(emailError);
          return;
        }
        setErrorMsg(result.message || "Format email tidak valid.");
        return;
      }

      // Handle specific error responses
      if (response.status === 403) {
        // Use backend message directly
        setErrorMsg(result.message || "Akun tidak aktif. Silakan hubungi administrator.");
        return;
      }

      if (response.status === 404) {
        // Use backend message directly
        setErrorMsg(result.message || "Email tidak terdaftar dalam sistem.");
        return;
      }

      if (!response.ok) {
        setErrorMsg(result.message || "Gagal mengirim kode OTP");
        return;
      }

      // Success response
      if (result.success || result.status === "success") {
        setSuccessMsg(result.message || "Kode OTP telah dikirim ke email Anda");
        setStep('otp');
        startResendTimer();
      } else {
        setErrorMsg(result.message || "Gagal mengirim kode OTP");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change - iOS compatible version using refs
  const handleOtpChange = (index, value) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length > 1) {
      // Handle paste - spread across inputs
      const pastedValue = numericValue.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedValue.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled input or next empty using refs
      const nextIndex = Math.min(index + pastedValue.length, 5);
      // Use setTimeout for iOS Safari compatibility
      setTimeout(() => {
        otpRefs.current[nextIndex]?.focus();
      }, 10);
    } else {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);
      
      // Auto-focus next input using refs
      if (numericValue && index < 5) {
        // Use setTimeout for iOS Safari compatibility
        setTimeout(() => {
          otpRefs.current[index + 1]?.focus();
        }, 10);
      }
    }
  };

  // Handle OTP key down for backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Use setTimeout for iOS Safari compatibility
      setTimeout(() => {
        otpRefs.current[index - 1]?.focus();
      }, 10);
    }
  };

  // Handle OTP paste event directly
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData?.getData('text') || '';
    const numericValue = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (numericValue) {
      const newOtp = [...otp];
      numericValue.split('').forEach((char, i) => {
        if (i < 6) {
          newOtp[i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus last input
      const lastIndex = Math.min(numericValue.length - 1, 5);
      setTimeout(() => {
        otpRefs.current[lastIndex]?.focus();
      }, 10);
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMsg("Masukkan 6 digit kode OTP");
      return;
    }

    setLoading(true);

    try {
      const payload = { 
        email: email.trim(),
        otp: otpCode 
      };

      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Handle different response formats
      if (response.status === 400) {
        // Bad Request - Invalid or expired OTP
        setErrorMsg(result.message || "Kode OTP tidak valid atau sudah kedaluwarsa");
        return;
      }

      if (response.status === 422) {
        // Validation error
        if (result.errors) {
          const firstError = Object.values(result.errors)[0];
          setErrorMsg(Array.isArray(firstError) ? firstError[0] : firstError);
        } else {
          setErrorMsg(result.message || "Data yang dikirim tidak valid");
        }
        return;
      }

      if (!response.ok) {
        setErrorMsg(result.message || "Kode OTP tidak valid");
        return;
      }

      // Success
      if (result.success || result.status === "success") {
        // Store reset token if backend provides it
        if (result.data && result.data.reset_token) {
          setResetToken(result.data.reset_token);
        } else {
          // If backend doesn't return new token, use the OTP code as token
          setResetToken(otpCode);
        }
        
        setSuccessMsg("Kode OTP berhasil diverifikasi");
        setErrorMsg(""); // Clear any previous errors
        setStep('reset');
      } else {
        setErrorMsg(result.message || "Kode OTP tidak valid");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setErrorMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim ulang kode OTP");
      }

      if (result.status === "success") {
        setSuccessMsg("Kode OTP baru telah dikirim");
        setOtp(["", "", "", "", "", ""]);
        startResendTimer();
      } else {
        setErrorMsg(result.message || "Gagal mengirim ulang kode OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setErrorMsg(error.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!newPassword) {
      setErrorMsg("Password baru wajib diisi");
      return;
    }
    
    if (newPassword.length < 8) {
      setErrorMsg("Password minimal 8 karakter");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMsg("Password tidak cocok");
      return;
    }

    setLoading(true);

    try {
      const tokenToUse = resetToken || otp.join('');
      
      // Try multiple field name variations
      const payloadVariations = [
        { 
          email: email.trim(),
          reset_token: tokenToUse,
          password: newPassword,
          password_confirmation: confirmPassword
        },
        { 
          email: email.trim(),
          token: tokenToUse,
          password: newPassword,
          password_confirmation: confirmPassword
        },
        { 
          email: email.trim(),
          reset_token: tokenToUse,
          otp: otp.join(''), // Try with both token and OTP
          password: newPassword,
          password_confirmation: confirmPassword
        },
        { 
          email: email.trim(),
          otp: otp.join(''), // Try original OTP code only
          password: newPassword,
          password_confirmation: confirmPassword
        }
      ];

      let lastError = null;
      let success = false;

      for (let i = 0; i < payloadVariations.length; i++) {
        const payload = payloadVariations[i];

        const response = await fetch(`${API_BASE_URL}/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          credentials: "include",
          mode: "cors",
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && (result.success || result.status === "success")) {
          setErrorMsg("");
          setStep('success');
          success = true;
          break;
        } else {
          lastError = result;
        }
      }

      if (!success) {
        // All attempts failed
        if (lastError.message) {
          setErrorMsg(lastError.message);
        } else {
          setErrorMsg("Gagal mengubah password. Silakan coba lagi.");
        }
      }
    } catch {
      setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <div className="forgotHeader">
              <div className="logoIcon">
                <Mail size={32} strokeWidth={1.5} />
              </div>
              <h1 className="formTitle">Lupa Kata Sandi?</h1>
              <p className="formSubtitle">
                Masukkan email Anda dan kami akan mengirimkan kode OTP untuk reset password
              </p>
            </div>

            <form className="forgotForm" onSubmit={handleSendOTP}>
              <div className="formGroup">
                <label className="inputLabel">Email</label>
                <div className="inputWrap">
                  <div className="iconWrapper">
                    <Mail className="inputIcon" size={20} />
                  </div>
                  <div className="inputFieldWrapper">
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      className="inputField"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="errorAlert">
                  <AlertCircle size={18} />
                  <p className="errorText">{errorMsg}</p>
                </div>
              )}

              <button type="submit" className="submitBtn" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Kode OTP"}
              </button>

              <p className="backToLogin">
                <Link to="/login" className="backLink">
                  <ArrowLeft size={16} />
                  Kembali ke Login
                </Link>
              </p>
            </form>
          </>
        );

      case 'otp':
        return (
          <>
            <div className="forgotHeader">
              <div className="logoIcon">
                <KeyRound size={32} strokeWidth={1.5} />
              </div>
              <h1 className="formTitle">Verifikasi OTP</h1>
              <p className="formSubtitle">
                Masukkan 6 digit kode yang telah dikirim ke<br />
                <strong>{email}</strong>
              </p>
            </div>

            <form className="forgotForm" onSubmit={handleVerifyOTP}>
              <div className="otpContainer">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="otpInput"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    disabled={loading}
                    autoComplete="one-time-code"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              {successMsg && (
                <div className="successAlert">
                  <CheckCircle size={18} />
                  <p className="successText">{successMsg}</p>
                </div>
              )}

              {errorMsg && (
                <div className="errorAlert">
                  <AlertCircle size={18} />
                  <p className="errorText">{errorMsg}</p>
                </div>
              )}

              <button type="submit" className="submitBtn" disabled={loading}>
                {loading ? "Memverifikasi..." : "Verifikasi"}
              </button>

              <div className="resendSection">
                <p className="resendText">
                  Tidak menerima kode?{" "}
                  {resendTimer > 0 ? (
                    <span className="timerText">Kirim ulang dalam {resendTimer}s</span>
                  ) : (
                    <button 
                      type="button" 
                      className="resendBtn" 
                      onClick={handleResendOTP}
                      disabled={loading}
                    >
                      Kirim Ulang
                    </button>
                  )}
                </p>
              </div>

              <p className="backToLogin">
                <button 
                  type="button" 
                  className="backLink"
                  onClick={() => setStep('email')}
                >
                  <ArrowLeft size={16} />
                  Ubah Email
                </button>
              </p>
            </form>
          </>
        );

      case 'reset':
        return (
          <>
            <div className="forgotHeader">
              <div className="logoIcon">
                <Lock size={32} strokeWidth={1.5} />
              </div>
              <h1 className="formTitle">Reset Kata Sandi</h1>
              <p className="formSubtitle">
                Buat kata sandi baru untuk akun Anda
              </p>
            </div>

            <form className="forgotForm" onSubmit={handleResetPassword}>
              <div className="formGroup">
                <label className="inputLabel">Kata Sandi Baru</label>
                <div className="inputWrap">
                  <div className="iconWrapper">
                    <Lock className="inputIcon" size={20} />
                  </div>
                  <div className="inputFieldWrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      className="inputField"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="button"
                    className="togglePassword"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="formGroup">
                <label className="inputLabel">Konfirmasi Kata Sandi</label>
                <div className="inputWrap">
                  <div className="iconWrapper">
                    <Lock className="inputIcon" size={20} />
                  </div>
                  <div className="inputFieldWrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi kata sandi"
                      className="inputField"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="button"
                    className="togglePassword"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {confirmPassword && newPassword === confirmPassword && (
                    <CheckCircle size={18} className="matchIcon" />
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="errorAlert">
                  <AlertCircle size={18} />
                  <p className="errorText">{errorMsg}</p>
                </div>
              )}

              <button type="submit" className="submitBtn" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
              </button>
            </form>
          </>
        );

      case 'success':
        return (
          <>
            <div className="forgotHeader">
              <div className="logoIcon success">
                <CheckCircle size={32} strokeWidth={1.5} />
              </div>
              <h1 className="formTitle">Berhasil!</h1>
              <p className="formSubtitle">
                Kata sandi Anda telah berhasil diubah. Silakan login dengan kata sandi baru.
              </p>
            </div>

            <Link to="/login" className="submitBtn successBtn">
              Masuk Sekarang
            </Link>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="forgotPageWrapper">
      {/* Back Button */}
      <button
        className="backButton"
        onClick={() => navigate("/landing")}
        aria-label="Kembali"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="forgotContainer">
        {/* Progress Steps */}
        {step !== 'success' && (
          <div className="progressSteps">
            <div className={`progressStep ${step === 'email' ? 'active' : ''} ${['otp', 'reset'].includes(step) ? 'completed' : ''}`}>
              <span className="stepNumber">1</span>
              <span className="stepLabel">Email</span>
            </div>
            <div className="progressLine" />
            <div className={`progressStep ${step === 'otp' ? 'active' : ''} ${step === 'reset' ? 'completed' : ''}`}>
              <span className="stepNumber">2</span>
              <span className="stepLabel">OTP</span>
            </div>
            <div className="progressLine" />
            <div className={`progressStep ${step === 'reset' ? 'active' : ''}`}>
              <span className="stepNumber">3</span>
              <span className="stepLabel">Reset</span>
            </div>
          </div>
        )}

        {renderStepContent()}
      </div>
    </div>
  );
}
