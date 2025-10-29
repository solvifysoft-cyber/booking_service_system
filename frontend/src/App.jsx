import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ServiceCategories from './components/ServiceCategories';
import ServiceCard from './components/ServiceCard';
import AddService from './components/AddService';
import MyServices from './components/my-services';
import UserProfile from './components/UserProfile';
import ProfileView from './components/ProfileView';
import BookServicePage from './components/BookServicePage';
import PaymentPage from './components/PaymentPage';
import BookingsPage from './components/BookingsPage';
import BookingDetails from './components/BookingDetails';
import Finances from './components/Finances';
import SetAvailability from './components/SetAvailability';
import FoodDeliveryAdd from './components/FoodDeliveryAdd';
import FoodDeliveryView from './components/FoodDeliveryView';
import AdminDashboard from './components/AdminDashboard';
import Feedback from './components/Feedback';
import Swal from 'sweetalert2';
import Footer from './components/Footer';
import ForgotPassword from './components/ForgotPassword';
import FoodDeliveryBookingsPage from './components/FoodDeliveryBookingsPage';

const Home = ({
  isAdmin,
  isLoggedIn,
  email,
  onLoginClick,
  onJoinClick,
  onLogout,
  userServiceCategory,
}) => {
  const [category, setCategory] = useState('All');
  const [services, setServices] = useState([]);
  const [foodDeliveries, setFoodDeliveries] = useState([]);
  const [users, setUsers] = useState([]);
  const [availabilities, setAvailabilities] = useState({}); // userId -> availability
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
    // eslint-disable-next-line
  }, [isAdmin]);

  // Fetch services, users, and food deliveries
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [servicesRes, usersRes, foodRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/servises', { credentials: 'include' }),
          fetch('http://localhost:3000/api/v1/user', { credentials: 'include' }),
          fetch('http://localhost:3000/api/v1/food-delivery', { credentials: 'include' }),
        ]);
        const servicesData = await servicesRes.json();
        const usersData = await usersRes.json();
        const foodData = await foodRes.json();
        setServices(Array.isArray(servicesData) ? servicesData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setFoodDeliveries(Array.isArray(foodData) ? foodData : []);
      } catch {
        setServices([]);
        setUsers([]);
        setFoodDeliveries([]);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Fetch availabilities for all users
  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/availability', { credentials: 'include' });
        const all = await res.json();
        // Map: userId -> first normal (not unavailable, not emergency) availability
        const map = {};
        if (Array.isArray(all)) {
          all.forEach(a => {
            if (!a.emergency && !a.unavailable && a.userId && !map[a.userId]) {
              map[a.userId] = a;
            }
          });
        }
        setAvailabilities(map);
      } catch {
        setAvailabilities({});
      }
    };
    fetchAvailabilities();
  }, [users]);

  // User map for quick access
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  // Filter services to only show those for approved users
  const approvedUserIds = users.filter(u => u.approved).map(u => u.id);

  // Service filtering (unchanged for Massage)
  let filtered = category === 'All'
    ? services.filter(s => approvedUserIds.includes(s.userId))
    : services.filter(s => s.category === category && approvedUserIds.includes(s.userId));

  // Only show one service per user
  const seenUserIds = new Set();
  filtered = filtered.filter(service => {
    if (seenUserIds.has(service.userId)) return false;
    seenUserIds.add(service.userId);
    return true;
  });

  // Apply search filter to services
  if (searchQuery.trim()) {
    filtered = filtered.filter(service => {
      const user = userMap[service.userId] || {};
      const businessName = (user.businessName || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const serviceName = (service.name || '').toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      return businessName.includes(searchLower) || 
             username.includes(searchLower) || 
             serviceName.includes(searchLower);
    });
  }

  // Food Delivery filtering
  let filteredFoods = [];
  if (category === 'Food Delivery') {
    const seenFoodUserIds = new Set();
    filteredFoods = foodDeliveries
      .filter(fd => approvedUserIds.includes(fd.userId))
      .filter(fd => {
        if (seenFoodUserIds.has(fd.userId)) return false;
        seenFoodUserIds.add(fd.userId);
        return true;
      });

    // Apply search filter to food deliveries
    if (searchQuery.trim()) {
      filteredFoods = filteredFoods.filter(food => {
        const user = userMap[food.userId] || {};
        const businessName = (user.businessName || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const foodName = (food.name || '').toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        
        return businessName.includes(searchLower) || 
               username.includes(searchLower) || 
               foodName.includes(searchLower);
      });
    }
  }

  // --- FIX: For "All" category, show both Massage/Service and Food Delivery ---
  let mixedAll = [];
  if (category === 'All') {
    // Combine all services and food deliveries, preserving order
    const combined = [
      ...services
        .filter(s => approvedUserIds.includes(s.userId))
        .map(s => ({
          ...s,
          _isFood: false,
          images: s.images,
          description: s.description,
          category: s.category,
        })),
      ...foodDeliveries
        .filter(fd => approvedUserIds.includes(fd.userId))
        .map(fd => ({
          ...fd,
          _isFood: true,
          images: fd.foodImage,
          description: fd.foodDescription,
          category: 'Food delivery',
        })),
    ];

    // Sort by createdAt or id if available (adjust field as needed)
    combined.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return (a.id || 0) - (b.id || 0);
    });

    // Only show the first record per user per category (userId+category)
    const seen = new Set();
    mixedAll = combined.filter(item => {
      const key = `${item.userId}_${item.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(item => {
      const user = userMap[item.userId] || {};
      return {
        ...item,
        user: {
          username: user.username || '',
          businessName: user.businessName || '',
          profileImage: user.profileImage || '',
        },
        availability: availabilities[item.userId] || null,
      };
    });

    // Apply search filter to mixed all results
    if (searchQuery.trim()) {
      mixedAll = mixedAll.filter(item => {
        const businessName = (item.user.businessName || '').toLowerCase();
        const username = (item.user.username || '').toLowerCase();
        const itemName = (item.name || '').toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        
        return businessName.includes(searchLower) || 
               username.includes(searchLower) || 
               itemName.includes(searchLower);
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <Navbar
        onLoginClick={onLoginClick}
        onJoinClick={onJoinClick}
        isLoggedIn={isLoggedIn}
        phone={email}
        onLogout={onLogout}
        serviceCategory={userServiceCategory || localStorage.getItem('userServiceCategory') || ''}
      />

      {/* Main content */}
      <div className="flex-1">
        {/* Hero */}
        <section
          className="flex flex-col items-center justify-center bg-gradient-to-r from-[#32CD32] via-[#1A1A1A] to-[#32CD32] w-full max-w-5xl mx-auto mt-6 rounded-xl px-6 py-6 shadow-lg"
          style={{
            minHeight: 120,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 text-center drop-shadow-lg">
            Find & Book Trusted Local Services
          </h1>
          {/* Tagline */}
          <p className="text-lg sm:text-xl text-gray-100 mb-4 text-center font-medium">
            Make your life easier by connecting with reliable service partners near you.
          </p>
          {/* Search Bar */}
          <div className="flex flex-row items-center justify-center w-full max-w-md">
            <span className="flex items-center bg-white rounded-full px-3 py-2 w-full shadow border border-gray-300">
              <svg
                className="text-gray-400 mr-2"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search for services or businesses..."
                className="bg-transparent outline-none text-gray-700 w-full text-base"
                style={{ minWidth: 0 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600 ml-1"
                  type="button"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </span>
          </div>
        </section>
        {/* Search Results Indicator */}
        {searchQuery.trim() && (
          <div className="max-w-4xl mx-auto px-4 mt-2">
            <div className="text-center">
              <p className="text-[#32CD32] text-sm">
                Search results for: <span className="font-semibold">"{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-gray-400 hover:text-white underline"
                >
                  Clear search
                </button>
              </p>
            </div>
          </div>
        )}
        
        {/* Categories */}
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <ServiceCategories selected={category} onSelect={setCategory} />
        </div>
        {/* Services */}
        <div className="
  max-w-5xl mx-auto px-1 py-4
  grid gap-2
  grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
">
          {loading ? (
            <div className="col-span-full text-center text-gray-400">Loading...</div>
          ) : category === 'Food Delivery' ? (
            filteredFoods.length === 0 ? (
              <div className="col-span-full text-center text-gray-400">
                {searchQuery.trim() ? `No food delivery found matching "${searchQuery}".` : 'No food delivery found.'}
              </div>
            ) : (
              filteredFoods.map(food => {
                const user = userMap[food.userId] || {};
                const availability = availabilities[food.userId] || null;
                return (
                  <ServiceCard
                    key={food.id}
                    service={{
                      ...food,
                      user: {
                        username: user.username || '',
                        businessName: user.businessName || '',
                        profileImage: user.profileImage || '',
                      },
                      images: food.foodImage,
                      description: food.foodDescription,
                      category: 'Food delivery',
                    }}
                    availability={availability || undefined}
                  />
                );
              })
            )
          ) : category === 'All' ? (
            mixedAll.length === 0 ? (
              <div className="col-span-full text-center text-gray-400">
                {searchQuery.trim() ? `No services or food delivery found matching "${searchQuery}".` : 'No services or food delivery found.'}
              </div>
            ) : (
              mixedAll.map(item => (
                <ServiceCard
                  key={item.id}
                  service={{
                    ...item,
                    images: item.images,
                    description: item.description,
                    category: item.category,
                  }}
                  availability={item.availability || undefined}
                />
              ))
            )
          ) : (
            filtered.length === 0 ? (
              <div className="col-span-full text-center text-gray-400">
                {searchQuery.trim() ? `No services found matching "${searchQuery}".` : 'No services found.'}
              </div>
            ) : (
              filtered.map(service => {
                const user = userMap[service.userId] || {};
                const availability = availabilities[service.userId] || null;
                return (
                  <ServiceCard
                    key={service.id}
                    service={{
                      ...service,
                      user: {
                        username: user.username || '',
                        businessName: user.businessName || '',
                        profileImage: user.profileImage || '',
                      },
                    }}
                    availability={availability || undefined}
                  />
                );
              })
            )
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  // App-wide session state
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [userServiceCategory, setUserServiceCategory] = useState('');
  const navigate = useNavigate();

  // Initialize app state
  useEffect(() => {
    setChecked(true);
  }, []);

  // Session check on mount and on login/logout
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
        const data = await res.json();
        
        if (data.userId) {
          setIsLoggedIn(true);
          setEmail(data.email || '');
          setIsAdmin(data.role === 'admin');

          // New: Fetch user info for service category
            fetch('http://localhost:3000/api/v1/user/' + data.userId)
              .then(r => r.json())
              .then(user => {
                setUserServiceCategory(user.serviceCategory || '');
                // Redirect after login based on serviceCategory
                if (user.serviceCategory === 'FOOD_DELIVERY') {
                  navigate('/food-delivery-bookings');
                } else if (user.serviceCategory === 'MASSAGE') {
                  navigate('/bookings');
                }
              });

          // Update localStorage for consistency
          localStorage.setItem('userRole', data.role || 'user');
          localStorage.setItem('userEmail', data.email || '');
          localStorage.setItem('userId', data.userId.toString());
        } else {
          setIsLoggedIn(false);
          setEmail('');
          setIsAdmin(false);
          setUserServiceCategory('');
          // Clear localStorage
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userId');
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setIsLoggedIn(false);
        setEmail('');
        setIsAdmin(false);
        setUserServiceCategory('');
        
        // Clear localStorage on error
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
      }
    };
    
    checkSession();
  }, []);

  // Auth handlers to pass to Home and Navbar
  const handleLoginClick = () => {
    showAuthForm(true);
  };

  const handleJoinClick = () => {
    showAuthForm(false);
  };

  const handleLogout = async () => {
    await fetch('http://localhost:3000/api/v1/login/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setIsLoggedIn(false);
    setEmail('');
    setIsAdmin(false);
    setUserServiceCategory('');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userServiceCategory');
    window.location.href = '/'; // Force reload to reset all state and UI
  };

  // Helper to return icon HTML for SweetAlert2
  const getInputIcon = (type) => {
    switch (type) {
      case 'email':
        return `<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#32CD32;"><svg width="18" height="18" fill="currentColor"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v.01L8 8l4-3.99V4H4zm8 2.236L8 10 4 6.236V14h8V6.236z"/></svg></span>`;
      case 'lock':
        return `<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#32CD32;"><svg width="18" height="18" fill="currentColor"><rect x="4" y="8" width="10" height="6" rx="2"/><path d="M7 8V6a2 2 0 114 0v2"/></svg></span>`;
      case 'user':
        return `<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#32CD32;"><svg width="18" height="18" fill="currentColor"><circle cx="9" cy="6" r="4"/><path d="M2 16c0-2.21 3.58-4 8-4s8 1.79 8 4"/></svg></span>`;
      case 'business':
        return `<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#32CD32;"><svg width="18" height="18" fill="currentColor"><rect x="2" y="7" width="14" height="9" rx="2"/><path d="M6 7V5a3 3 0 016 0v2"/></svg></span>`;
      case 'phone':
        return `<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#32CD32;"><svg width="18" height="18" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 22 2 13.93 2 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.21 1.11l-2.2 2.2z"/></svg></span>`;
      default:
        return '';
    }
  };

  // --- Updated showAuthForm for forgot password and join now ---
  const showAuthForm = (loginMode) => {
    Swal.fire({
      title: loginMode ? 'Login' : 'Join Us',
      html: `
      <button id="swal-close-btn" style="
        position:absolute;
        top:10px;
        right:10px;
        background:none;
        border:none;
        color:#fff;
        font-size:1.5em;
        cursor:pointer;
        z-index:10;
      " aria-label="Close">&times;</button>
      ${
        loginMode
          ? `
        <div style="position:relative;">
          ${getInputIcon('email')}
          <input type="email" id="swal-login-email" class="swal2-input" placeholder="Email" autocomplete="username" style="padding-left:36px;" />
        </div>
        <div style="position:relative;">
          ${getInputIcon('lock')}
          <input type="password" id="swal-login-password" class="swal2-input" placeholder="Password" autocomplete="current-password" style="padding-left:36px;" />
        </div>
        <div id="custom-extra-links"></div>
      `
          : `
        <div style="position:relative;">
          ${getInputIcon('user')}
          <input type="text" id="swal-join-username" class="swal2-input" placeholder="Username" style="padding-left:36px;" />
        </div>  
        <div style="position:relative;">
          ${getInputIcon('business')}
          <input type="text" id="swal-join-businessName" class="swal2-input" placeholder="Business Name (optional)" style="padding-left:36px;" />
        </div>
        <!-- SERVICE CATEGORY SELECTION: NOW APPEARS HERE -->
        <div style="margin:18px 0 18px 0; padding:0; text-align:center;">
          <label style="color:#32CD32; font-size:1.12em; font-weight:bold; display:block; margin-bottom:10px; letter-spacing:0.5px;">Select Service Category</label>
          <div class="swal2-service-category-flex" style="display:flex;flex-direction:row;justify-content:center;align-items:center;gap:32px;">
            <label style="display:flex;align-items:center;gap:8px;font-weight:600;cursor:pointer;font-size:1.1em;">
              <input type="radio" name="swal-join-serviceCategory" value="MASSAGE" style="width:20px;height:20px;accent-color:#32CD32;outline:2px solid #32CD32;box-shadow:0 0 0 3px #1A1A1A;" />
              <span style="color:white;">Massage</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-weight:600;cursor:pointer;font-size:1.1em;">
              <input type="radio" name="swal-join-serviceCategory" value="FOOD_DELIVERY" style="width:20px;height:20px;accent-color:#32CD32;outline:2px solid #32CD32;box-shadow:0 0 0 3px #1A1A1A;" />
              <span style="color:white;">Food Delivery</span>
            </label>
          </div>
        </div>
        <!-- END SERVICE CATEGORY SELECTION -->
        <div style="position:relative;">
          ${getInputIcon('email')}
          <input type="email" id="swal-join-email" class="swal2-input" placeholder="Email" autocomplete="username" style="padding-left:36px;" />
        </div>
        <div style="position:relative;">
          ${getInputIcon('phone')}
          <input type="tel" id="swal-join-phone" class="swal2-input" placeholder="Phone" style="padding-left:36px;" />
        </div>
        <div style="position:relative;">
          ${getInputIcon('lock')}
          <input type="password" id="swal-join-password" class="swal2-input" placeholder="Password" autocomplete="new-password" style="padding-left:36px;" />
        </div>
        <div style="position:relative;">
          ${getInputIcon('lock')}
          <input type="password" id="swal-join-confirmPassword" class="swal2-input" placeholder="Confirm Password" autocomplete="new-password" style="padding-left:36px;" />
        </div>
      `
      }
    `,
    background: '#1A1A1A',
    color: '#fff',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: loginMode ? 'Login' : 'Register',
    cancelButtonColor: '#232323',
    confirmButtonColor: '#32CD32',
    didOpen: () => {
      // Add close icon handler
      document.getElementById('swal-close-btn')?.addEventListener('click', () => {
        Swal.close();
      });

      // Add custom links below the login form
      if (loginMode) {
        const extra = document.createElement('div');
        extra.className = 'flex flex-col items-center mt-4';
        extra.innerHTML = `
          <button type="button" id="swal-forgot-password" class="text-[#32CD32] underline mb-2" style="background:none;border:none;cursor:pointer;">Forgot password?</button>
          <span>
            New to Book Me? 
            <button type="button" id="swal-join-now" class="text-[#32CD32] underline" style="background:none;border:none;cursor:pointer;">Join Now</button>
          </span>
        `;
        const target = document.getElementById('custom-extra-links');
        if (target) target.appendChild(extra);

        // Add event listeners for navigation
        document.getElementById('swal-forgot-password')?.addEventListener('click', () => {
          Swal.close();
          navigate('/forgot-password');
        });
        document.getElementById('swal-join-now')?.addEventListener('click', () => {
          Swal.close();
          showAuthForm(false);
        });
      }
    },
    preConfirm: () => {
      if (loginMode) {
        const email = document.getElementById('swal-login-email').value;
        const password = document.getElementById('swal-login-password').value;
        if (!email || !password) {
          Swal.showValidationMessage('Please enter email and password');
          return false;
        }
        return { email, password };
      } else {
        const username = document.getElementById('swal-join-username').value;
        const businessName = document.getElementById('swal-join-businessName').value;
        const email = document.getElementById('swal-join-email').value;
        const phone = document.getElementById('swal-join-phone').value;
        const password = document.getElementById('swal-join-password').value;
        const confirmPassword = document.getElementById('swal-join-confirmPassword').value;
        // Service Category - required for all except future admin
        const serviceCategoryElem = document.querySelector('input[name="swal-join-serviceCategory"]:checked');
        const serviceCategory = serviceCategoryElem ? serviceCategoryElem.value : '';
        if (!username || !email || !phone || !password || !confirmPassword) {
          Swal.showValidationMessage('Please fill all required fields');
          return false;
        }
        if (password !== confirmPassword) {
          Swal.showValidationMessage('Passwords do not match');
          return false;
        }
        if (!serviceCategory) {
          Swal.showValidationMessage('Please select a service category');
          return false;
        }
        return { username, businessName, email, phone, password, confirmPassword, serviceCategory };
      }
    },
    customClass: {
      popup: 'swal2-popup-custom',
      confirmButton: 'swal2-confirm-custom',
      cancelButton: 'swal2-cancel-custom',
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      if (loginMode) {
        // Login
        try {
          const res = await fetch('http://localhost:3000/api/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.value),
            credentials: 'include',
          });
          const data = await res.json();
          if (!res.ok) {
            Swal.fire('Error', data.message || 'Login failed', 'error');
            return;
          }
if (data.user && (data.user.role === 'admin' || data.user.isAdmin)) {
  setIsLoggedIn(true);
  setEmail(result.value.email);
  localStorage.setItem('userRole', 'admin'); // <-- add this
  navigate('/admin');
  Swal.fire('Success', 'Login successful! Redirecting to admin dashboard.', 'success');
  return;
}
            if (data.user && (data.user.approved === false || data.user.approved === 'false')) {
              Swal.fire('Not Approved', 'Your account is not approved yet. Please wait for admin approval.', 'warning');
              return;
            }
            setIsLoggedIn(true);
            setEmail(result.value.email);
            setIsAdmin(data.user.role === 'admin');
            
            // Update localStorage
            localStorage.setItem('userRole', data.user.role || 'user');
            localStorage.setItem('userEmail', data.user.email || '');
            localStorage.setItem('userId', data.user.id.toString());
              // Fetch and persist user's service category so Navbar can use it immediately
              fetch('http://localhost:3000/api/v1/user/' + data.user.id, { credentials: 'include' })
                .then(r => r.json())
                .then(user => {
                  const serviceCategory = user.serviceCategory || '';
                  setUserServiceCategory(serviceCategory);
                  localStorage.setItem('userServiceCategory', serviceCategory);
                  // Redirect after login based on serviceCategory
                  if (serviceCategory === 'FOOD_DELIVERY') {
                    navigate('/food-delivery-bookings');
                  } else if (serviceCategory === 'MASSAGE') {
                    navigate('/bookings');
                  }
                }).catch(() => {
                  setUserServiceCategory('');
                  localStorage.removeItem('userServiceCategory');
                });
            
            Swal.fire('Success', 'Login successful! Redirecting to your dashboard.', 'success');
          } catch (err) {
            Swal.fire('Error', err.message, 'error');
          }
        } else {
          // Register
          try {
            const res = await fetch('http://localhost:3000/api/v1/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(result.value),
              credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
              // Handle specific validation errors with better messages
              let errorMessage = 'Registration failed';
              if (data.message) {
                if (data.message.includes('email already exists')) {
                  errorMessage = 'This email address is already registered. Please use a different email.';
                } else if (data.message.includes('Phone number already exists')) {
                  errorMessage = 'This phone number is already registered. Please use a different phone number.';
                } else if (data.message.includes('Username already exists')) {
                  errorMessage = 'This username is already taken. Please choose a different username.';
                } else if (data.message.includes('Business name already exists')) {
                  errorMessage = 'This business name is already registered. Please use a different business name.';
                } else if (data.message.includes('Passwords do not match')) {
                  errorMessage = 'Passwords do not match. Please check your password confirmation.';
                } else if (data.message.includes('Invalid email')) {
                  errorMessage = 'Please enter a valid email address.';
                } else if (data.message.includes('Invalid phone')) {
                  errorMessage = 'Please enter a valid phone number.';
                } else {
                  errorMessage = data.message;
                }
              }
              Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: errorMessage,
                confirmButtonColor: '#32CD32'
              });
              return;
            }
            Swal.fire({
              icon: 'success',
              title: 'Registration Successful!',
              text: 'Your account has been created. Please wait for admin approval before you can start using the service.',
              confirmButtonColor: '#32CD32'
            });
          } catch (err) {
            Swal.fire({
              icon: 'error',
              title: 'Network Error',
              text: 'Unable to connect to the server. Please check your internet connection and try again.',
              confirmButtonColor: '#32CD32'
            });
          }
        }
      }
    });
  };

  if (!checked) return null;

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              isAdmin={isAdmin}
              isLoggedIn={isLoggedIn}
              email={email}
              onLoginClick={handleLoginClick}
              onJoinClick={handleJoinClick}
              onLogout={handleLogout}
              userServiceCategory={userServiceCategory}
            />
          }
        />
        <Route path="/add-service" element={
          isAdmin ? <Navigate to="/admin" /> :
          userServiceCategory === 'FOOD_DELIVERY' ? <Navigate to="/food-delivery" /> : <AddService isLoggedIn={isLoggedIn} email={email} />
        } />
        <Route path="/my-services" element={
          isAdmin ? <Navigate to="/admin" /> :
          userServiceCategory === 'FOOD_DELIVERY' ? <Navigate to="/food-delivery-view" /> : <MyServices isLoggedIn={isLoggedIn} email={email} />
        } />
        <Route path="/user-profile" element={isAdmin ? <Navigate to="/admin" /> : <UserProfile isLoggedIn={isLoggedIn} email={email} />} />
        <Route path="/profile-view" element={isAdmin ? <Navigate to="/admin" /> : <ProfileView isLoggedIn={isLoggedIn} email={email} />} />
        <Route path="/book-service/:id" element={isAdmin ? <Navigate to="/admin" /> : <BookServicePage isLoggedIn={isLoggedIn} email={email} />} />
        <Route path="/payment" element={isAdmin ? <Navigate to="/admin" /> : <PaymentPage isLoggedIn={isLoggedIn} email={email} />} />
        <Route path="/bookings" element={
          isAdmin ? <Navigate to="/admin" /> :
          userServiceCategory === 'FOOD_DELIVERY' ? <Navigate to="/food-delivery-bookings" /> : <BookingsPage isLoggedIn={isLoggedIn} email={email} />
        } />
        <Route path="/booking-details" element={isAdmin ? <Navigate to="/admin" /> : <BookingDetails isLoggedIn={isLoggedIn} email={email} />} />
        <Route path="/finances" element={isAdmin ? <Navigate to="/admin" /> : <Finances isLoggedIn={isLoggedIn} email={email} serviceCategory={userServiceCategory} />} />
        <Route path="/set-availability" element={isAdmin ? <Navigate to="/admin" /> : <SetAvailability isLoggedIn={isLoggedIn} email={email} />} />
        <Route path="/food-delivery" element={
          userServiceCategory === 'MASSAGE' ? <Navigate to="/add-service" /> : <FoodDeliveryAdd email={email} />
        } />
        <Route path="/food-delivery-view" element={
          userServiceCategory === 'MASSAGE' ? <Navigate to="/my-services" /> : <FoodDeliveryView email={email} />
        } />
        <Route path="/food-delivery-bookings" element={
          userServiceCategory === 'MASSAGE' ? <Navigate to="/bookings" /> : <FoodDeliveryBookingsPage isLoggedIn={isLoggedIn} email={email} />
        } />
        <Route path="/admin" element={<AdminDashboard onLogout={handleLogout} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/feedback" element={<Feedback />} />
           </Routes>
    </>
  );
};

export default App;
