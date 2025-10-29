import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ProfileView() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // Get userId from session
        const sessionRes = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
        const sessionData = await sessionRes.json();
        if (!sessionData.userId) throw new Error('Session expired. Please log in again.');
        // Fetch full user info
        const res = await fetch(`http://localhost:3000/api/v1/user/${sessionData.userId}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (!user) return <div className="text-red-500 p-8">User not found or session expired.</div>;

  return (
    <div className="min-h-screen bg-black text-white">
  {/* Navbar with user email */}
  <Navbar isLoggedIn={true} phone={user.email} userName={user.username || user.businessName} serviceCategory={localStorage.getItem('userServiceCategory') || ''} />
      <div className="flex flex-col items-center justify-center pt-10">
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <img
              src={user.profileImage || '/default-user-icon.png'}
              alt="Profile"
              className="w-28 h-28 rounded-full border-4 border-blue-600 object-cover shadow-lg mb-4"
            />
            <h2 className="text-2xl font-bold">{user.username || 'Your Username'}</h2>
            <p className="text-gray-400">{user.businessName && <span>Business: {user.businessName}</span>}</p>
            <p className="text-gray-400">{user.email}</p>
            <p className="text-gray-400">{user.phone ? `Phone: ${user.phone}` : ''}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}