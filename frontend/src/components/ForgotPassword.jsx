import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import logo from '../assets/LOGO-SERVICE.png';
import Footer from './Footer';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp+new password, 3: done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('http://localhost:3000/api/v1/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMsg(data.message || 'Failed to send reset email.');
      } else {
        setStep(2);
        setMsg('OTP sent to your email. Please check your inbox.');
      }
    } catch {
      setMsg('Network error. Please try again.');
    }
    setLoading(false);
  };

  // Step 2: Verify OTP and set new password
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('http://localhost:3000/api/v1/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMsg(data.message || 'Failed to reset password.');
      } else {
        setStep(3);
        setMsg('Password reset successful! You can now log in.');
      }
    } catch {
      setMsg('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <section className="bg-[#1A1A1A] sticky top-0 z-50 text-[#32CD32] px-2 py-3 shadow-md">
        <div className="flex items-center justify-between mb-3 max-w-3xl mx-auto w-full">
          <div className="flex items-center space-x-3">
            <img
              src={logo}
              alt="Service Logo"
              className="w-32 h-auto object-contain cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#32CD32] text-black font-semibold hover:bg-white hover:text-[#32CD32] transition"
            aria-label="Back"
          >
            <FiArrowLeft className="text-xl" />
            <span className="text-base font-bold">Back</span>
          </button>
        </div>
        <p className="text-center text-lg font-medium text-white">
          Forgot your password? We’ll help you reset it.
        </p>
      </section>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-2 py-6">
        <div className="bg-[#1A1A1A] rounded-xl p-8 w-full max-w-md mx-auto shadow-lg border border-[#232323]">
          <h2 className="text-center text-2xl font-bold mb-4 text-[#32CD32]">
            Reset Your Password
          </h2>

          {msg && (
            <div className="mb-4 text-center text-sm text-yellow-400">{msg}</div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequest} className="flex flex-col gap-4">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className="p-3 rounded bg-[#232323] border border-gray-700 text-white placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-[#32CD32] text-black px-6 py-3 rounded font-semibold hover:bg-white hover:text-[#32CD32] transition"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <input
                type="text"
                required
                placeholder="Enter OTP from your email"
                className="p-3 rounded bg-[#232323] border border-gray-700 text-white placeholder-gray-400"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Enter new password"
                className="p-3 rounded bg-[#232323] border border-gray-700 text-white placeholder-gray-400"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-[#32CD32] text-black px-6 py-3 rounded font-semibold hover:bg-white hover:text-[#32CD32] transition"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center">
              <p className="mb-4 text-gray-300">
                Password reset successful! You can now log in.
              </p>
              <button
                className="bg-[#32CD32] text-black px-6 py-2 rounded font-semibold hover:bg-white hover:text-[#32CD32] transition"
                onClick={() => navigate('/')}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;