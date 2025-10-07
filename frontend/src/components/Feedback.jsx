import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Swal from "sweetalert2";
import logo from "../assets/LOGO-SERVICE.png";
import Footer from "./Footer";

const Feedback = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // 2. Send feedback as JSON (not multipart)
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
    };

    try {
      const res = await fetch("http://localhost:3000/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Failed to send feedback";
        try {
          const data = await res.json();
          if (data && data.message)
            msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        } catch {}
        Swal.fire("Error", msg, "error");
        setSubmitting(false);
        return;
      }
      Swal.fire("Thank you!", "Your feedback has been submitted.", "success").then(() =>
        navigate("/")
      );
    } catch (err) {
      Swal.fire("Error", "Failed to send feedback. Please try again.", "error");
    }
    setSubmitting(false);
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
          >
            <FiArrowLeft className="text-xl" />
            <span className="text-base font-bold">Back</span>
          </button>
        </div>
        <p className="text-center text-lg font-medium text-white">
          Tell us what to improve. Your voice matters.
        </p>
      </section>

      {/* Form Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-[#1A1A1A] w-full max-w-3xl mx-auto border border-[#32CD32] shadow-lg rounded-2xl p-6">
          <h2 className="text-[#32CD32] text-2xl font-bold text-center mb-6">
            We’d love your feedback
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              placeholder="Your name"
              className="bg-[#222] text-white rounded px-4 py-2 border border-[#222] focus:border-[#32CD32] outline-none"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your email"
              className="bg-[#222] text-white rounded px-4 py-2 border border-[#222] focus:border-[#32CD32] outline-none"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Your phone number (optional)"
              className="bg-[#222] text-white rounded px-4 py-2 border border-[#222] focus:border-[#32CD32] outline-none"
              value={form.phone}
              onChange={handleChange}
            />
            <textarea
              name="message"
              placeholder="What do you want to say? Suggestions, improvements, issues…"
              className="bg-[#222] text-white rounded px-4 py-2 border border-[#222] focus:border-[#32CD32] outline-none min-h-[100px]"
              value={form.message}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3 rounded bg-[#32CD32] text-black font-bold text-lg hover:bg-white hover:text-[#32CD32] transition"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Sending..." : "Send Feedback"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;