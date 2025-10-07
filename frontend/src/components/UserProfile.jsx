import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { FaUser, FaBuilding, FaPhone, FaEnvelope } from 'react-icons/fa';

export default function UserProfile() {
  const [user, setUser] = useState({
    username: '',
    businessName: '',
    email: '',
    phone: '',
    profileImage: '',
  });
  const [profileImage, setProfileImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef();

  // Fetch user from session
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch user session');
        const data = await res.json();
        if (!data.userId) throw new Error('Session expired. Please log in again.');
        // Fetch full user info
        const userRes = await fetch(`http://localhost:3000/api/v1/user/${data.userId}`);
        if (!userRes.ok) throw new Error('Failed to fetch user profile');
        const userData = await userRes.json();
        setUser({
          username: userData.username || '',
          businessName: userData.businessName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          profileImage: userData.profileImage || '',
        });
        setProfileImage(userData.profileImage || '');
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let uploadedImageFilename = user.profileImage;

    // If a new image file is selected, upload it first
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      try {
        const uploadRes = await fetch('http://localhost:3000/api/v1/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const uploadData = await uploadRes.json();
        uploadedImageFilename = uploadData.filename;
      } catch (err) {
        Swal.fire('Error', 'Image upload failed: ' + err.message, 'error');
        setLoading(false);
        return;
      }
    }

    try {
      // Get userId from session
      const sessionRes = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
      const sessionData = await sessionRes.json();
      if (!sessionData.userId) throw new Error('Session expired. Please log in again.');
      const userId = sessionData.userId;

      const { username, businessName, phone, email } = user;
      const res = await fetch(`http://localhost:3000/api/v1/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          businessName,
          phone,
          email,
          profileImage: uploadedImageFilename,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      Swal.fire('Success', data.message || 'Profile updated successfully!', 'success').then(() => {
        navigate('/profile-view');
      });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
    setLoading(false);
  };

  const iconClass = "absolute left-3 top-1/2 transform -translate-y-1/2 text-[#32CD32] text-lg";

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar isLoggedIn={true} phone={user.email} />
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Profile Image on Top */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <img
              src={profileImage || '/default-user-icon.png'}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-[#32CD32] object-cover shadow-lg"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Upload profile image"
            />
            <button
              className="absolute bottom-2 right-2 bg-[#232323] bg-opacity-80 text-xs px-3 py-1 rounded-full hover:bg-[#32CD32] hover:text-black transition"
              onClick={() => fileInputRef.current.click()}
              type="button"
            >
              Edit
            </button>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold">{user.username || 'Your Username'}</h2>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-[#1A1A1A] rounded-lg shadow-lg p-6 border border-[#232323]">
          <h2 className="text-xl font-semibold mb-4 text-[#32CD32]">Profile Information</h2>
          <div className="space-y-4">
            {/* Username */}
            <div className="relative">
              <FaUser className={iconClass} />
              <input
                type="text"
                name="username"
                className="w-full bg-[#232323] text-white border border-[#32CD32] p-2 rounded pl-10 focus:outline-none focus:border-[#32CD32]"
                value={user.username}
                onChange={handleChange}
                placeholder="Username"
              />
            </div>
            {/* Business Name */}
            <div className="relative">
              <FaBuilding className={iconClass} />
              <input
                type="text"
                name="businessName"
                className="w-full bg-[#232323] text-white border border-[#32CD32] p-2 rounded pl-10 focus:outline-none focus:border-[#32CD32]"
                value={user.businessName}
                onChange={handleChange}
                placeholder="Business Name"
              />
            </div>
            {/* Phone */}
            <div className="relative">
              <FaPhone className={iconClass} />
              <input
                type="text"
                name="phone"
                className="w-full bg-[#232323] text-white border border-[#32CD32] p-2 rounded pl-10 focus:outline-none focus:border-[#32CD32]"
                value={user.phone}
                onChange={handleChange}
                placeholder="Phone"
              />
            </div>
            {/* Email */}
            <div className="relative">
              <FaEnvelope className={iconClass} />
              <input
                type="email"
                name="email"
                className="w-full bg-[#232323] text-white border border-[#32CD32] p-2 rounded pl-10 opacity-60 cursor-not-allowed"
                value={user.email}
                disabled
                placeholder="Email"
              />
            </div>
            <button
              className="mt-4 bg-[#32CD32] hover:bg-white hover:text-[#32CD32] px-4 py-2 rounded w-full font-semibold transition text-black"
              onClick={handleSave}
              disabled={loading}
              type="button"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}