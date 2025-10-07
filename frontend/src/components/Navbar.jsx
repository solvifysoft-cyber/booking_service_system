import React, { useState } from 'react';
import {
  FiPlus,
  FiList,
  FiLogOut,
  FiX,
  FiUser,
  FiHome,
  FiCalendar,
  FiClock,
  FiDollarSign
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import defaultLogo from '../assets/LOGO-SERVICE.png';
import menuLogo from '../assets/Book me, bg_white.png';

const Navbar = ({ onLoginClick, onJoinClick, isLoggedIn, phone, onLogout, userProfile }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAddService = () => {
    setMenuOpen(false);
    Swal.fire({
      title: 'Add Service',
      text: 'What would you like to add?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Add Massage',
      cancelButtonText: 'Add Food Delivery',
      confirmButtonColor: '#32CD32',
      cancelButtonColor: '#1e90ff',
      reverseButtons: true,
      background: '#f9f9f9',
      color: '#222',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/add-service', { state: { category: 'Massage' } });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        navigate('/food-delivery');
      }
    });
  };

  const handleHome = () => {
    setMenuOpen(false);
    navigate('/');
  };

  const handleMyServices = () => {
    setMenuOpen(false);
      setMenuOpen(false);
  Swal.fire({
    title: 'view Service',
    text: 'What would you like to View?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'View Massage',
    cancelButtonText: 'View Food Delivery',
    confirmButtonColor: '#32CD32',
    cancelButtonColor: '#1e90ff',
    reverseButtons: true,
    background: '#f9f9f9',
    color: '#222',
  }).then((result) => {
    if (result.isConfirmed) {
      navigate('/my-services', { state: { category: 'Massage' } });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      navigate('/food-delivery-view');
    }
  });
  };

const handleBookings = () => {
  setMenuOpen(false);
  Swal.fire({
    title: 'View Booking',
    text: 'What would you like to view?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'View Massage',
    cancelButtonText: 'View Food Delivery',
    confirmButtonColor: '#32CD32',
    cancelButtonColor: '#1e90ff',
    reverseButtons: true,
    background: '#f9f9f9',
    color: '#222',
  }).then((result) => {
    if (result.isConfirmed) {
      navigate('/bookings', { state: { category: 'Massage' } });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      navigate('/food-delivery-bookings');
    }
  });
};


  const handleAvailability = () => {
    setMenuOpen(false);
    navigate('/set-availability');
  };

  const handleFinances = () => {
    setMenuOpen(false);
    navigate('/finances');
  };

  const handleProfile = () => {
    setMenuOpen(false);
    Swal.fire({
      title: 'Profile Options',
      text: 'What would you like to do?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update Profile',
      cancelButtonText: 'View Profile',
      confirmButtonColor: '#32CD32',
      cancelButtonColor: '#1e90ff',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/user-profile');
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        navigate('/profile-view');
      }
    });
  };

  const handleLogout = async () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#32CD32',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setMenuOpen(false);
        await fetch('http://localhost:3000/api/v1/login/logout', {
          method: 'POST',
          credentials: 'include',
        });
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        if (onLogout) onLogout();
        window.location.href = '/';

      }
    });
  };

  const handleSwitchToProvider = () => {
    if (typeof onLoginClick === 'function') onLoginClick();
  };

  return (
    <header className="bg-[#1A1A1A] shadow-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Brand & Hamburger */}
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button
              className="text-2xl text-white focus:outline-none"
              aria-label="Toggle Menu"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
          )}
          <img
            src={defaultLogo}
            alt="Service.com Logo"
            className="w-32 h-auto cursor-pointer"
            onClick={() => {
              setMenuOpen(false);
              navigate('/');
            }}
          />
        </div>

        {/* User phone display */}
        {isLoggedIn && phone && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-white font-semibold bg-gradient-to-r from-[#1e90ff] to-[#32CD32] px-4 py-1 rounded-full shadow">
              <FiUser className="text-lg text-white" />
              {phone}
            </span>
          </div>
        )}

        {/* Switch to Provider Button */}
        {!isLoggedIn && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleSwitchToProvider}
              className="text-sm bg-[#32CD32] text-black px-4 py-1 rounded hover:bg-white hover:text-[#32CD32] transition duration-300 font-semibold"
            >
              Switch to Provider
            </button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {isLoggedIn && menuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex">
          <div className="bg-white w-72 h-full p-6 flex flex-col relative">
            <div className="flex items-center justify-between mb-8">
              <span className="flex items-center gap-3">
                {userProfile && (
                  <img
                    src={userProfile}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-[#32CD32] object-cover"
                  />
                )}
                <img
                  src={menuLogo}
                  alt="Book me Logo"
                  className="w-32 h-auto"
                />
              </span>
              <button
                className="text-2xl text-black focus:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <nav className="flex flex-col gap-6 text-[#1A1A1A]">
              <button onClick={handleHome} className="flex items-center gap-3 text-base hover:text-[#32CD32]">
                <FiHome className="text-xl" /> Home
              </button>
              <button onClick={handleAddService} className="flex items-center gap-3 text-base hover:text-[#32CD32]">
                <FiPlus className="text-xl" /> Add Service
              </button>
              <button onClick={handleMyServices} className="flex items-center gap-3 text-base hover:text-[#32CD32]">
                <FiList className="text-xl" /> My Services
              </button>
              <button onClick={handleBookings} className="flex items-center gap-3 text-base hover:text-[#32CD32]">
                <FiCalendar className="text-xl" /> Bookings
              </button>
              <button onClick={handleAvailability} className="flex items-center gap-3 text-base hover:text-[#32CD32]">
                <FiClock className="text-xl" /> Set Availability
              </button>
              <button onClick={handleFinances} className="flex items-center gap-3 text-base hover:text-[#32CD32]">
                <FiDollarSign className="text-xl" /> Finances
              </button>
              <button onClick={handleProfile} className="flex items-center gap-3 text-base hover:text-[#32CD32]">
                <FiUser className="text-xl" /> Profile
              </button>
              <button onClick={handleLogout} className="flex items-center gap-3 text-base hover:text-[#32CD32]">
                <FiLogOut className="text-xl" /> Logout
              </button>
            </nav>
          </div>
          <div className="flex-1" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};

export default Navbar;
