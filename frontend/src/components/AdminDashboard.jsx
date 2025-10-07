import React, { useEffect, useState, useMemo } from 'react';
import { FiUsers, FiList, FiDollarSign, FiCalendar, FiRefreshCw, FiSettings, FiChevronLeft, FiChevronRight, FiSearch, FiSlash, FiEye, FiUserCheck, FiLogOut, FiMessageSquare, FiDownload } from 'react-icons/fi';
import { FaUtensils } from 'react-icons/fa'; // For food delivery icon
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Footer from './Footer';
import classNames from 'classnames'; // Optional: for cleaner class logic (install with npm if you want)
import jsPDF from 'jspdf'; // npm install jspdf

const PAGE_SIZE = 5;
const DEFAULT_IMAGE = '/default-user-icon.png';

const menu = [
  { label: 'Dashboard', icon: <FiRefreshCw />, path: '/admin' },
  { label: 'Users', icon: <FiUsers />, path: '/admin?tab=users' },
  { label: 'Bookings', icon: <FiCalendar />, path: '/admin?tab=bookings' },
  { label: 'Services', icon: <FiList />, path: '/admin?tab=services' },
  { label: 'Payments', icon: <FiDollarSign />, path: '/admin?tab=payments' },
  { label: 'Cashflow', icon: <FiDollarSign />, path: '/admin?tab=cashflow' }, // <-- Added
  { label: 'Feedback', icon: <FiMessageSquare />, path: '/admin?tab=feedback' },
  { label: 'Settings', icon: <FiSettings />, path: '/admin?tab=settings' },
];

const toArray = (data) => Array.isArray(data) ? data : [];

const AdminDashboard = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foodDeliveries, setFoodDeliveries] = useState([]); // <-- ADD THIS LINE

  // UI state
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Admin features
  const [bookingDate, setBookingDate] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');

  // Admin profile state for settings
  const [adminProfile, setAdminProfile] = useState({
    username: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  // --- SESSION CHECK: Only allow access if user is admin ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
        const data = await res.json();
        if (!data.userId || !(data.role === 'admin' || data.isAdmin)) {
          Swal.fire({
            icon: 'warning',
            title: 'Access Denied',
            text: 'You must be logged in as admin to access this page.',
            confirmButtonColor: '#32CD32',
          }).then(() => {
            navigate('/');
          });
        }
      } catch {
        navigate('/');
      }
    };
    checkSession();
    // Only run on mount
    // eslint-disable-next-line
  }, []);

  // Handle tab from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setTab(params.get('tab') || 'dashboard');
    setPage(1);
    setSearch('');
  }, [location.search]);

  // Fetch all data on mount (with session)
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [usersRes, servicesRes, bookingsRes, paymentsRes, foodRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/user', { credentials: 'include' }),
          fetch('http://localhost:3000/api/v1/servises', { credentials: 'include' }),
          fetch('http://localhost:3000/api/v1/payments', { credentials: 'include' }),
          fetch('http://localhost:3000/api/v1/payments', { credentials: 'include' }),
          fetch('http://localhost:3000/api/v1/food-delivery', { credentials: 'include' }), // <-- ADD THIS LINE
        ]);
        const usersData = await usersRes.json();
        const servicesData = await servicesRes.json();
        const bookingsData = await bookingsRes.json();
        const paymentsData = await paymentsRes.json();
        const foodDeliveriesData = await foodRes.json(); // <-- ADD THIS LINE
        setUsers(toArray(usersData));
        setServices(toArray(servicesData));
        setBookings(toArray(bookingsData));
        setPayments(toArray(paymentsData));
        setFoodDeliveries(toArray(foodDeliveriesData)); // <-- ADD THIS LINE
      } catch (err) {
        setUsers([]);
        setServices([]);
        setBookings([]);
        setPayments([]);
        setFoodDeliveries([]); // <-- ADD THIS LINE
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Fetch feedbacks on mount or when tab is feedback
  useEffect(() => {
    fetch('http://localhost:3000/api/v1/feedback', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFeedbacks(Array.isArray(data) ? data : []))
      .catch(() => setFeedbacks([]));
  }, [tab]);

  // Memoized user map for fast lookup
  const userMap = useMemo(() => {
    const map = {};
    users.forEach(u => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // Approve user (with improved error handling)
  const handleApproveUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/user/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'userrole': localStorage.getItem('userRole') || '',
        },
        credentials: 'include',
      });
      if (!res.ok) {
        let msg = 'Failed to approve user';
        try {
          const data = await res.json();
          if (data && data.message) msg = data.message;
        } catch {}
        throw new Error(msg);
      }
      setUsers(users => users.map(u => u.id === userId ? { ...u, approved: true } : u));
      Swal.fire('Success', 'User approved!', 'success');
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to approve user', 'error');
    }
  };

  // Reject user (with improved error handling)
  const handleRejectUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/user/${userId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'userrole': localStorage.getItem('userRole') || '',
        },
        credentials: 'include',
      });
      if (!res.ok) {
        let msg = 'Failed to reject user';
        try {
          const data = await res.json();
          if (data && data.message) msg = data.message;
        } catch {}
        throw new Error(msg);
      }
      setUsers(users => users.map(u => u.id === userId ? { ...u, approved: false } : u));
      Swal.fire('Success', 'User rejected!', 'success');
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to reject user', 'error');
    }
  };

  // SweetAlert for provider details and their services (with service table)
  const showProviderDetails = (provider) => {
    // Separate services by category for this provider
    const providerServices = services.filter(s => String(s.userId) === String(provider.id));
    const providerFoods = foodDeliveries.filter(f => String(f.userId) === String(provider.id));

    // Massage/Service Table HTML
    const massageTable = `
      <div style="margin-bottom:18px;">
        <div style="font-weight:bold;font-size:17px;color:#32CD32;margin-bottom:6px;">Massage Services</div>
        <table style="width:100%;margin-top:6px;font-size:13px;border-collapse:collapse;">
          <thead>
            <tr style="background:#232323;color:#32CD32;">
              <th style="padding:4px;border:1px solid #222;">Name</th>
              <th style="padding:4px;border:1px solid #222;">Image</th>
              <th style="padding:4px;border:1px solid #222;">Price</th>
              <th style="padding:4px;border:1px solid #222;">Location</th>
              <th style="padding:4px;border:1px solid #222;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Description</th>
              <th style="padding:4px;border:1px solid #222;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${
              providerServices.length
                ? providerServices.map(s => {
                    let img = DEFAULT_IMAGE;
                    if (Array.isArray(s.images) && s.images.length > 0) img = s.images[0];
                    else if (typeof s.images === 'string' && s.images) img = s.images;
                    return `
                      <tr>
                        <td style="padding:4px;border:1px solid #222;">${s.name || '-'}</td>
                        <td style="padding:4px;border:1px solid #222;">
                          <img src="${img}"
                               alt="service"
                               style="width:40px;height:40px;object-fit:cover;border-radius:6px;"
                               onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}';"
                          />
                        </td>
                        <td style="padding:4px;border:1px solid #222;">${s.price ? s.price + ' Rwf' : '-'}</td>
                        <td style="padding:4px;border:1px solid #222;">${s.location || '-'}</td>
                        <td style="padding:4px;border:1px solid #222;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.description || '-'}</td>
                        <td style="padding:4px;border:1px solid #222;">${s.duration + 'Min' || '-'}</td>
                      </tr>
                    `;
                  }).join('')
                : `<tr><td colspan="6" style="color:#aaa;text-align:center;">No services</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;

    // Food Delivery Table HTML
    const foodTable = `
      <div>
        <div style="font-weight:bold;font-size:17px;color:#32CD32;margin-bottom:6px;">Food Delivery</div>
        <table style="width:100%;margin-top:6px;font-size:13px;border-collapse:collapse;">
          <thead>
            <tr style="background:#232323;color:#32CD32;">
              <th style="padding:4px;border:1px solid #222;">Name</th>
              <th style="padding:4px;border:1px solid #222;">Image</th>
              <th style="padding:4px;border:1px solid #222;">Price</th>
              <th style="padding:4px;border:1px solid #222;">Category</th>
              <th style="padding:4px;border:1px solid #222;">Ingredients</th>
              <th style="padding:4px;border:1px solid #222;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${
              providerFoods.length
                ? providerFoods.map(f => {
                    let img = DEFAULT_IMAGE;
                    if (f.foodImage && typeof f.foodImage === 'string') {
                      img = f.foodImage.startsWith('http')
                        ? f.foodImage
                        : `http://localhost:3000/uploads/${f.foodImage}`;
                    }
                    return `
                      <tr>
                        <td style="padding:4px;border:1px solid #222;">${f.name || '-'}</td>
                        <td style="padding:4px;border:1px solid #222;">
                          <img src="${img}"
                               alt="food"
                               style="width:40px;height:40px;object-fit:cover;border-radius:6px;"
                               onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}';"
                          />
                        </td>
                        <td style="padding:4px;border:1px solid #222;">${f.price ? f.price + ' Rwf' : '-'}</td>
                        <td style="padding:4px;border:1px solid #222;">${f.category || '-'}</td>
                        <td style="padding:4px;border:1px solid #222;">${f.ingredients || '-'}</td>
                        <td style="padding:4px;border:1px solid #222;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.foodDescription || '-'}</td>
                      </tr>
                    `;
                  }).join('')
                : `<tr><td colspan="6" style="color:#aaa;text-align:center;">No food delivery items</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;

    Swal.fire({
      title: provider.username || provider.businessName || 'Provider Details',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <img src="${provider.profileImage || DEFAULT_IMAGE}" alt="profile" style="width:80px;height:80px;border-radius:50%;margin-bottom:10px;border:2px solid #32CD32;object-fit:cover;" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}';" />
          <div><b>Username:</b> ${provider.username || '-'}</div>
          <div><b>Business Name:</b> ${provider.businessName || '-'}</div>
          <div><b>Email:</b> ${provider.email || '-'}</div>
          <div><b>Phone:</b> ${provider.phone || '-'}</div>
          <div style="margin-top:10px;text-align:left;max-height:220px;overflow:auto;width:100%;">
            ${massageTable}
            ${foodTable}
          </div>
        </div>
      `,
      showCloseButton: true,
      confirmButtonColor: '#32CD32',
      confirmButtonText: 'Close',
      background: '#232323',
      color: '#fff',
      width: 800,
    });
  };

  // Stats
  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Filtering logic
  const getFiltered = (data, keys) => {
    if (!search) return data;
    return data.filter(item =>
      keys.some(key =>
        String(item[key] || '')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  };

  // Pagination logic
  const getPageData = (data) => {
    const start = (page - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  };
  const getPageCount = (data) => Math.ceil(data.length / PAGE_SIZE);

  // User options for dropdown
  const userOptions = users.map(u => ({
    value: u.id,
    label: u.username || u.businessName || u.email,
  }));

  // Bookings filtering (date, status, user)
  const filteredBookings = bookings.filter(b => {
    let match = true;
    if (bookingDate) {
      const bookingDay = new Date(b.datetime).toDateString();
      const filterDay = bookingDate.toDateString();
      match = match && bookingDay === filterDay;
    }
    if (bookingStatus !== 'all') {
      match = match && (b.status || '').toLowerCase() === bookingStatus;
    }
    if (selectedUser) {
      match = match && String(b.userId) === String(selectedUser);
    }
    return match;
  });

  // For user services view
  const userServices = selectedUser
    ? services.filter(s => String(s.userId) === String(selectedUser))
    : [];

  // Admin profile state for settings
  useEffect(() => {
    const admin = users.find(u => u.isAdmin || u.role === 'admin');
    if (admin) {
      setAdminProfile({
        username: admin.username || '',
        email: admin.email || '',
        password: '',
      });
    }
  }, [users]);

  // Handle admin profile update
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setAdminProfile(prev => ({ ...prev, [name]: value }));
  };

  const admin = users.find(u => u.isAdmin || u.role === 'admin');
  const adminId = admin?.id;

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Update Profile?',
      text: 'Are you sure you want to update your profile?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#32CD32',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Update',
      background: '#232323',
      color: '#fff',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const payload = {
            username: adminProfile.username,
            email: adminProfile.email,
          };
          if (adminProfile.password && adminProfile.password.trim() !== '') {
            payload.password = adminProfile.password;
          }
          // Use the admin's actual ID endpoint
          const res = await fetch(`http://localhost:3000/api/v1/user/${adminId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'userrole': 'admin',
            },
            credentials: 'include',
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            let msg = 'Failed to update profile';
            try {
              const data = await res.json();
              if (data && data.message) msg = data.message;
            } catch {}
            throw new Error(msg);
          }
          Swal.fire({
            title: 'Profile Updated!',
            icon: 'success',
            confirmButtonColor: '#32CD32',
          });
        } catch (err) {
          Swal.fire('Error', err.message || 'Failed to update profile', 'error');
        }
      }
    });
  };

  // Handle logout
  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#32CD32',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Logout',
      background: '#232323',
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        if (typeof onLogout === 'function') onLogout(); // Only call the prop!
        // Do NOT call window.location.href or clear localStorage here!
      }
    });
  };

  // Cashflow export PDF handler
  const handleExportCashflowPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Cashflow Transactions', 14, 18);
    doc.setFontSize(10);

    // Table header
    doc.text('Date', 14, 28);
    doc.text('User', 50, 28);
    doc.text('Type', 90, 28);
    doc.text('Amount', 120, 28);
    doc.text('Status', 150, 28);

    let y = 34;
    payments.forEach((p, idx) => {
      doc.text(p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-', 14, y);
      doc.text(`${p.firstName || ''} ${p.lastName || ''}`, 50, y);
      doc.text(p.paymentMethod || '-', 90, y);
      doc.text(`${typeof p.amount === 'number' ? p.amount.toLocaleString() : p.amount} Rwf`, 120, y);
      doc.text(p.status || '-', 150, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 20; }
    });

    doc.save('cashflow.pdf');
  };

  // Tab content
  let content = null;
  if (tab === 'users') {
    const filtered = getFiltered(users, ['username', 'businessName', 'email', 'role']);
    const paged = getPageData(filtered);
    content = (
      <>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full bg-[#232323] rounded-lg text-sm md:text-base">
            <thead>
              <tr className="text-left text-[#32CD32]">
                <th className="p-1 md:p-2 text-xs md:text-base">#</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Name</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Email</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Role</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Actions</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Viewing Details</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((u, idx) => (
                <tr key={u.id} className="border-b border-[#1A1A1A]">
                  <td className="p-1 md:p-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="p-1 md:p-2">{u.username || u.businessName}</td>
                  <td className="p-1 md:p-2">{u.email}</td>
                  <td className="p-1 md:p-2">{u.role || (u.isAdmin ? 'Admin' : 'User')}</td>
                  <td className="p-1 md:p-2 flex gap-2">
                    {!u.approved && (
                      <button
                        className="px-3 py-1 rounded bg-green-500 text-white font-semibold flex items-center gap-1 hover:bg-green-700 transition"
                        onClick={() => handleApproveUser(u.id)}
                      >
                        <FiUserCheck /> Approve
                      </button>
                    )}
                    {u.approved && (
                      <button
                        className="px-3 py-1 rounded bg-yellow-500 text-black font-semibold flex items-center gap-1 hover:bg-yellow-700 transition"
                        onClick={() => handleRejectUser(u.id)}
                      >
                        <FiSlash /> Reject
                      </button>
                    )}
                  </td>
                  <td className="p-1 md:p-2">
                    <button
                      className="px-3 py-1 rounded bg-[#32CD32] text-black font-semibold flex items-center gap-1 hover:bg-white hover:text-[#32CD32] transition"
                      onClick={() => showProviderDetails(u)}
                    >
                      <FiEye /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} pageCount={getPageCount(filtered)} />
      </>
    );
  } else if (tab === 'services') {
    const filtered = getFiltered(services, ['name', 'category', 'userId']);
    const paged = getPageData(filtered);

    // Fetch food delivery items (assuming you have a state for them)
    // If not, fetch here or add to your fetchAll useEffect
    // Example: const [foodDeliveries, setFoodDeliveries] = useState([]);
    // and in fetchAll: setFoodDeliveries(toArray(foodDeliveriesData));

    content = (
      <>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full bg-[#232323] rounded-lg mb-8">
            <thead>
              <tr className="text-left text-[#32CD32]">
                <th className="p-1 md:p-2 text-xs md:text-base">#</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Name</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Category</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Provider</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Price</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Location</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Description</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Duration</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s, idx) => (
                <tr key={s.id} className="border-b border-[#1A1A1A]">
                  <td className="p-1 md:p-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="p-1 md:p-2">{s.name}</td>
                  <td className="p-1 md:p-2">{s.category}</td>
                  <td className="p-1 md:p-2">{userMap[s.userId]?.username || userMap[s.userId]?.businessName || '-'}</td>
                  <td className="p-1 md:p-2">{typeof s.price === 'number' ? s.price.toLocaleString() : s.price} Rwf</td>
                  <td className="p-1 md:p-2">{s.location}</td>
                  <td className="p-1 md:p-2">{s.description}</td>
                  <td className="p-1 md:p-2">{s.duration} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* --- Food Delivery Table --- */}
        <div className="overflow-x-auto w-full">
          <h2 className="text-xl font-bold mb-2 text-[#32CD32] flex items-center gap-2">
            <FaUtensils /> Food Delivery Items
          </h2>
          <table className="min-w-full bg-[#232323] rounded-lg">
            <thead>
              <tr className="text-left text-[#32CD32]">
                <th className="p-1 md:p-2 text-xs md:text-base">#</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Name</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Category</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Provider</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Price</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Ingredients</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Description</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Image</th>
              </tr>
            </thead>
            <tbody>
              {(foodDeliveries || []).map((fd, idx) => (
                <tr key={fd.id} className="border-b border-[#1A1A1A]">
                  <td className="p-1 md:p-2">{idx + 1}</td>
                  <td className="p-1 md:p-2">{fd.name}</td>
                  <td className="p-1 md:p-2">{fd.category}</td>
                  <td className="p-1 md:p-2">{userMap[fd.userId]?.username || userMap[fd.userId]?.businessName || '-'}</td>
                  <td className="p-1 md:p-2">{typeof fd.price === 'number' ? fd.price.toLocaleString() : fd.price} Rwf</td>
                  <td className="p-1 md:p-2">{fd.ingredients}</td>
                  <td className="p-1 md:p-2">{fd.foodDescription}</td>
                  <td className="p-1 md:p-2">
                    {fd.foodImage ? (
                      <img
                        src={fd.foodImage.startsWith('http') ? fd.foodImage : `http://localhost:3000/uploads/${fd.foodImage}`}
                        alt={fd.name}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}
                        onError={e => { e.target.src = DEFAULT_IMAGE; }}
                      />
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} pageCount={getPageCount(filtered)} />
      </>
    );
  } else if (tab === 'bookings') {
    const paged = getPageData(filteredBookings);

    // Separate bookings by category
    const massageBookings = paged.filter(
      b => Array.isArray(b.paymentServices) && b.paymentServices.length > 0
    );
    const foodBookings = paged.filter(
      b => Array.isArray(b.paymentFoodDeliveries) && b.paymentFoodDeliveries.length > 0
    );

    content = (
      <>
        {/* Filters */}
        <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 mb-4 items-center">
          <div>
            <label className="text-sm text-gray-300 mr-2">Filter by date:</label>
            <DatePicker
              selected={bookingDate}
              onChange={date => setBookingDate(date)}
              placeholderText="Select date"
              className="rounded px-2 py-1 text-black"
              dateFormat="yyyy-MM-dd"
              isClearable
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mr-2">Status:</label>
            <select
              value={bookingStatus}
              onChange={e => setBookingStatus(e.target.value)}
              className="rounded px-2 py-1 text-black"
            >
              <option value="all">All</option>
              <option value="done">Done</option>
              <option value="due">Due</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mr-2">User:</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="rounded px-2 py-1 text-black"
            >
              <option value="">All</option>
              {userOptions.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          {selectedUser && (
            <button
              className="ml-2 px-3 py-1 rounded bg-[#32CD32] text-black font-semibold"
              onClick={() => setSelectedUser('')}
            >
              Clear User
            </button>
          )}
        </div>
        {/* Massage Bookings Table */}
        <div className="overflow-x-auto mb-10">
          <h2 className="text-xl font-bold mb-2 text-[#32CD32]">Massage Bookings</h2>
          <table className="min-w-full bg-[#232323] rounded-lg">
            <thead>
              <tr className="text-left text-[#32CD32]">
                <th className="p-1 md:p-2 text-xs md:text-base">ID</th>
                <th className="p-1 md:p-2 text-xs md:text-base">User</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Service Name</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Quantity</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Date</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Booking Location</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Status</th>
              </tr>
            </thead>
            <tbody>
              {massageBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-4">No massage bookings found.</td>
                </tr>
              ) : (
                massageBookings.map((b, idx) => (
                  <tr key={b.id} className="border-b border-[#1A1A1A]">
                    <td className="p-1 md:p-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="p-1 md:p-2">{b.firstName} {b.lastName}</td>
                    <td className="p-1 md:p-2">
                      {b.paymentServices.map(ps => ps.service?.name || '-').join(', ')}
                    </td>
                    <td className="p-1 md:p-2">
                      {b.paymentServices.map(ps => ps.quantity || 1).join(', ')}
                    </td>
                    <td className="p-1 md:p-2">{b.datetime ? new Date(b.datetime).toLocaleString() : '-'}</td>
                    <td className="p-1 md:p-2">{b.bookingLocation || '-'}</td>
                    <td className="p-1 md:p-2">{b.status || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Food Delivery Bookings Table */}
        <div className="overflow-x-auto">
          <h2 className="text-xl font-bold mb-2 text-[#32CD32] flex items-center gap-2">
            <FaUtensils /> Food Delivery Bookings
          </h2>
          <table className="min-w-full bg-[#232323] rounded-lg">
            <thead>
              <tr className="text-left text-[#32CD32]">
                <th className="p-1 md:p-2 text-xs md:text-base">ID</th>
                <th className="p-1 md:p-2 text-xs md:text-base">User</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Food Name</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Quantity</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Date</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Booking Location</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Status</th>
              </tr>
            </thead>
            <tbody>
              {foodBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-4">No food delivery bookings found.</td>
                </tr>
              ) : (
                foodBookings.map((b, idx) => (
                  <tr key={b.id} className="border-b border-[#1A1A1A]">
                    <td className="p-1 md:p-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="p-1 md:p-2">{b.firstName} {b.lastName}</td>
                    <td className="p-1 md:p-2">
                      {b.paymentFoodDeliveries.map(fd => fd.foodDelivery?.name || '-').join(', ')}
                    </td>
                    <td className="p-1 md:p-2">
                      {b.paymentFoodDeliveries.map(fd => fd.quantity || 1).join(', ')}
                    </td>
                    <td className="p-1 md:p-2">{b.datetime ? new Date(b.datetime).toLocaleString() : '-'}</td>
                    <td className="p-1 md:p-2">{b.bookingLocation || '-'}</td>
                    <td className="p-1 md:p-2">{b.status || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} pageCount={getPageCount(filteredBookings)} />
        {/* Removed "Services by ..." table below the bookings tables */}
      </>
    );
  } else if (tab === 'payments') {
    const filtered = getFiltered(payments, ['firstName', 'lastName', 'paymentMethod']);
    const paged = getPageData(filtered);

    // Separate payments by category
    const massagePayments = paged.filter(
      p => Array.isArray(p.paymentServices) && p.paymentServices.length > 0
    );
    const foodPayments = paged.filter(
      p => Array.isArray(p.paymentFoodDeliveries) && p.paymentFoodDeliveries.length > 0
    );

    // Helper for status badge
    const statusBadge = (status) => {
      if (!status) return <span className="px-2 py-1 rounded bg-gray-500 text-white text-xs">Unknown</span>;
      const s = status.toLowerCase();
      if (s === 'done' || s === 'paid') return <span className="px-2 py-1 rounded bg-[#32CD32] text-black text-xs">Paid</span>;
      if (s === 'pending' || s === 'due') return <span className="px-2 py-1 rounded bg-yellow-500 text-black text-xs">Pending</span>;
      if (s === 'canceled' || s === 'cancelled') return <span className="px-2 py-1 rounded bg-red-500 text-white text-xs">Canceled</span>;
      return <span className="px-2 py-1 rounded bg-gray-500 text-white text-xs">{status}</span>;
    };

    content = (
      <>
        {/* Massage Services Payments */}
        <div className="overflow-x-auto mb-10">
          <h2 className="text-xl font-bold mb-2 text-[#32CD32]">Massage Services Payments</h2>
          <table className="min-w-full bg-[#232323] rounded-lg">
            <thead>
              <tr className="text-left text-[#32CD32]">
                <th className="p-1 md:p-2 text-xs md:text-base">ID</th>
                <th className="p-1 md:p-2 text-xs md:text-base">User</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Service Name</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Amount</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Status</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Date</th>
              </tr>
            </thead>
            <tbody>
              {massagePayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-4">No payments found.</td>
                </tr>
              ) : (
                massagePayments.map((p, idx) => (
                  <tr key={p.id} className="border-b border-[#1A1A1A]">
                    <td className="p-1 md:p-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="p-1 md:p-2">{p.firstName} {p.lastName}</td>
                    <td className="p-1 md:p-2">
                      {p.paymentServices.map(ps => ps.service?.name || '-').join(', ')}
                    </td>
                    <td className="p-1 md:p-2">{typeof p.amount === 'number' ? p.amount.toLocaleString() : p.amount} Rwf</td>
                    <td className="p-1 md:p-2">{statusBadge(p.status)}</td>
                    <td className="p-1 md:p-2">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Food Delivery Payments */}
        <div className="overflow-x-auto">
          <h2 className="text-xl font-bold mb-2 text-[#32CD32] flex items-center gap-2">
            <FaUtensils /> Food Delivery Payments
          </h2>
          <table className="min-w-full bg-[#232323] rounded-lg">
            <thead>
              <tr className="text-left text-[#32CD32]">
                <th className="p-1 md:p-2 text-xs md:text-base">ID</th>
                <th className="p-1 md:p-2 text-xs md:text-base">User</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Food Name</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Amount</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Status</th>
                <th className="p-1 md:p-2 text-xs md:text-base">Date</th>
              </tr>
            </thead>
            <tbody>
              {foodPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-4">No payments found.</td>
                </tr>
              ) : (
                foodPayments.map((p, idx) => (
                  <tr key={p.id} className="border-b border-[#1A1A1A]">
                    <td className="p-1 md:p-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="p-1 md:p-2">{p.firstName} {p.lastName}</td>
                    <td className="p-1 md:p-2">
                      {p.paymentFoodDeliveries.map(fd => fd.foodDelivery?.name || '-').join(', ')}
                    </td>
                    <td className="p-1 md:p-2">{typeof p.amount === 'number' ? p.amount.toLocaleString() : p.amount} Rwf</td>
                    <td className="p-1 md:p-2">{statusBadge(p.status)}</td>
                    <td className="p-1 md:p-2">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} pageCount={getPageCount(filtered)} />
      </>
    );
  } else if (tab === 'feedback') {
    content = (
      <div className="max-w-4xl mx-auto bg-[#232323] rounded-lg p-8 shadow">
        <h2 className="text-2xl font-bold text-[#32CD32] mb-6 flex items-center gap-2">
          <FiMessageSquare /> Feedback ({feedbacks.length})
        </h2>
        {feedbacks.length === 0 ? (
          <div className="text-gray-400 text-center">No feedback submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[#232323] rounded-lg">
              <thead>
                <tr className="text-left text-[#32CD32]">
                  <th className="p-1 md:p-2 text-xs md:text-base">#</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Name</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Email</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Phone</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Message</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb, idx) => (
                  <tr key={fb.id} className="border-b border-[#1A1A1A]">
                    <td className="p-1 md:p-2">{idx + 1}</td>
                    <td className="p-1 md:p-2">{fb.name}</td>
                    <td className="p-1 md:p-2">{fb.email}</td>
                    <td className="p-1 md:p-2">{fb.phone || '-'}</td>
                    <td className="p-1 md:p-2 max-w-xs break-words">{fb.message}</td>
                    <td className="p-1 md:p-2">{fb.createdAt ? new Date(fb.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } else if (tab === 'settings') {
    content = (
      <div className="max-w-xl mx-auto bg-[#232323] rounded-lg p-8 shadow">
        <h2 className="text-2xl font-bold text-[#32CD32] mb-6 flex items-center gap-2">
          <FiSettings /> Admin Settings
        </h2>
        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-300 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={adminProfile.username}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 rounded bg-[#1A1A1A] text-white"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={adminProfile.email}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 rounded bg-[#1A1A1A] text-white"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={adminProfile.password}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 rounded bg-[#1A1A1A] text-white"
              placeholder="Enter new password"
            />
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 rounded bg-[#32CD32] text-black font-semibold flex items-center gap-2 justify-center"
          >
            <FiUserCheck /> Update Profile
          </button>
        </form>
        <hr className="my-6 border-gray-700" />
        <button
          className="px-4 py-2 rounded bg-red-500 text-white font-semibold flex items-center gap-2 justify-center w-full"
          onClick={handleLogout}
        >
          <FiLogOut /> Logout
        </button>
      </div>
    );
  } else if (tab === 'cashflow') {
    // --- Group payments by date ---
    const groupByDate = (payments) => {
      const groups = { Today: [], Yesterday: [], Previous: [] };
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      payments.forEach(p => {
        const date = p.createdAt ? new Date(p.createdAt) : null;
        if (!date) return;
        if (date.toDateString() === today.toDateString()) {
          groups.Today.push(p);
        } else if (date.toDateString() === yesterday.toDateString()) {
          groups.Yesterday.push(p);
        } else {
          groups.Previous.push(p);
        }
      });
      // Sort previous by date descending
      groups.Previous.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return groups;
    };

    const grouped = groupByDate(payments);

    // Helper for paid status
    const paidText = (status) => {
      if (!status) return '';
      const s = status.toLowerCase();
      if (s === 'done' || s === 'paid' || s === 'yes') return 'Yes';
      if (s === 'pending' || s === 'due' || s === 'no') return 'No';
      return status;
    };

    // Helper for total per group
    const groupTotal = (arr) =>
      arr.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Export PDF as displayed
    const handleExportCashflowPDF = () => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      let y = 32;
      doc.setFontSize(18);
      doc.setTextColor(50, 205, 50); // #32CD32
      doc.text('Cash flow', 32, y);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const renderTable = (label, group) => {
        if (!group.length) return;
        y += 24;
        doc.setFont(undefined, 'bold');
        doc.text(label, 32, y);
        y += 16;
        doc.setFont(undefined, 'normal');
        // Table header
        doc.setFillColor(24, 24, 24);
        doc.setTextColor(255, 255, 255);
        doc.rect(32, y, 400, 20, 'F');
        doc.text('No', 40, y + 14);
        doc.text('Client name', 80, y + 14);
        doc.text('Amount', 250, y + 14);
        doc.text('Paid', 350, y + 14);
        y += 20;
        doc.setTextColor(0, 0, 0);

        group.forEach((p, idx) => {
          doc.rect(32, y, 400, 20);
          doc.text(String(idx + 1), 40, y + 14);
          doc.text(`${p.firstName || ''} ${p.lastName || ''}`.trim() || '-', 80, y + 14);
          doc.text(`${typeof p.amount === 'number' ? p.amount.toLocaleString() : p.amount} Rwf`, 250, y + 14);
          doc.text(paidText(p.status), 350, y + 14);
          y += 20;
          if (y > 750) { doc.addPage(); y = 32; }
        });
        // Total row
        doc.setFont(undefined, 'bold');
        doc.rect(32, y, 400, 20);
        doc.text('Total', 40, y + 14);
        doc.text(`${groupTotal(group).toLocaleString()} Rwf`, 250, y + 14);
        doc.setFont(undefined, 'normal');
        y += 28;
      };

      renderTable('Today', grouped.Today);
      renderTable('Yesterday', grouped.Yesterday);

      // Previous dates: group by date string
      if (grouped.Previous.length) {
        let prevGroups = {};
        grouped.Previous.forEach(p => {
          const d = new Date(p.createdAt);
          const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          if (!prevGroups[label]) prevGroups[label] = [];
          prevGroups[label].push(p);
        });
        Object.entries(prevGroups).forEach(([dateLabel, arr]) => {
          renderTable(dateLabel, arr);
        });
      }

      doc.save('cashflow.pdf');
    };

    content = (
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <button
            className="flex items-center gap-1 font-bold text-[#32CD32] hover:underline transition"
            onClick={handleExportCashflowPDF}
            style={{ order: 0 }} // Ensure left alignment
          >
            Export <FiDownload className="inline text-lg" /> PDF
          </button>
          {/* Optionally, add a placeholder div for spacing if you want to keep the row height */}
          <div />
        </div>
        <div className="bg-transparent rounded-lg">
          {/* Today */}
          {grouped.Today.length > 0 && (
            <div className="mb-6 border border-gray-400 rounded-lg overflow-hidden" style={{ background: 'transparent' }}>
              <div className="bg-[#181818] text-white font-bold px-4 py-2 text-base border-b border-gray-400">
                Today
              </div>
              <table className="w-full text-white text-sm border-separate" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr className="bg-transparent">
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold">No</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Client name</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Amount</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.Today.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="border border-gray-400 px-2 py-2">{idx + 1}</td>
                      <td className="border border-gray-400 px-2 py-2">{`${p.firstName || ''} ${p.lastName || ''}`.trim() || '-'}</td>
                      <td className="border border-gray-400 px-2 py-2">{typeof p.amount === 'number' ? p.amount.toLocaleString() : p.amount} Rwf</td>
                      <td className="border border-gray-400 px-2 py-2">{paidText(p.status)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-gray-400 px-2 py-2 font-bold" colSpan={2}>Total</td>
                    <td className="border border-gray-400 px-2 py-2 font-bold">{groupTotal(grouped.Today).toLocaleString()} Rwf</td>
                    <td className="border border-gray-400 px-2 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {/* Yesterday */}
          {grouped.Yesterday.length > 0 && (
            <div className="mb-6 border border-gray-400 rounded-lg overflow-hidden" style={{ background: 'transparent' }}>
              <div className="bg-[#181818] text-white font-bold px-4 py-2 text-base border-b border-gray-400">
                Yesterday
              </div>
              <table className="w-full text-white text-sm border-separate" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr className="bg-transparent">
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold">No</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Client name</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Amount</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.Yesterday.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="border border-gray-400 px-2 py-2">{idx + 1}</td>
                      <td className="border border-gray-400 px-2 py-2">{`${p.firstName || ''} ${p.lastName || ''}`.trim() || '-'}</td>
                      <td className="border border-gray-400 px-2 py-2">{typeof p.amount === 'number' ? p.amount.toLocaleString() : p.amount} Rwf</td>
                      <td className="border border-gray-400 px-2 py-2">{paidText(p.status)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-gray-400 px-2 py-2 font-bold" colSpan={2}>Total</td>
                    <td className="border border-gray-400 px-2 py-2 font-bold">{groupTotal(grouped.Yesterday).toLocaleString()} Rwf</td>
                    <td className="border border-gray-400 px-2 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {/* Previous Dates */}
          {(() => {
            // Group previous by date string
            const prevGroups = {};
            grouped.Previous.forEach(p => {
              const d = new Date(p.createdAt);
              const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              if (!prevGroups[label]) prevGroups[label] = [];
              prevGroups[label].push(p);
            });
            return Object.entries(prevGroups).map(([dateLabel, group]) => (
              <div
                key={dateLabel}
                className="mb-6 border border-gray-400 rounded-lg overflow-hidden"
                style={{ background: 'transparent' }}
              >
                <div className="bg-[#181818] text-white font-bold px-4 py-2 text-base border-b border-gray-400">
                  {dateLabel}
                </div>
                <table className="w-full text-white text-sm border-separate" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr className="bg-transparent">
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">No</th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Client name</th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Amount</th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="border border-gray-400 px-2 py-2">{idx + 1}</td>
                        <td className="border border-gray-400 px-2 py-2">{`${p.firstName || ''} ${p.lastName || ''}`.trim() || '-'}</td>
                        <td className="border border-gray-400 px-2 py-2">{typeof p.amount === 'number' ? p.amount.toLocaleString() : p.amount} Rwf</td>
                        <td className="border border-gray-400 px-2 py-2">{paidText(p.status)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="border border-gray-400 px-2 py-2 font-bold" colSpan={2}>Total</td>
                      <td className="border border-gray-400 px-2 py-2 font-bold">{groupTotal(group).toLocaleString()} Rwf</td>
                      <td className="border border-gray-400 px-2 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ));
          })()}
        </div>
      </div>
    );
  } else {
    // Dashboard tab: show all tables and stats, search on top right, all paginated
    const filteredUsers = getFiltered(users, ['username', 'businessName', 'email', 'role']);
    const filteredServices = getFiltered(services, ['name', 'category', 'userId']);
    const filteredBookings = getFiltered(bookings, ['firstName', 'lastName', 'status']);
    const filteredPayments = getFiltered(payments, ['firstName', 'lastName', 'paymentMethod']);

    content = (
      <>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-[#232323] rounded-xl p-6 flex flex-col items-center shadow">
            <FiUsers className="text-3xl text-[#32CD32] mb-2" />
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-gray-400">Users</div>
          </div>
          <div className="bg-[#232323] rounded-xl p-6 flex flex-col items-center shadow">
            <FiList className="text-3xl text-[#32CD32] mb-2" />
            <div className="text-2xl font-bold">{services.length}</div>
            <div className="text-gray-400">Services</div>
          </div>
          <div className="bg-[#232323] rounded-xl p-6 flex flex-col items-center shadow">
            <FiCalendar className="text-3xl text-[#32CD32] mb-2" />
            <div className="text-2xl font-bold">{bookings.length}</div>
            <div className="text-gray-400">Bookings</div>
          </div>
          <div className="bg-[#232323] rounded-xl p-6 flex flex-col items-center shadow">
            <FiDollarSign className="text-3xl text-[#32CD32] mb-2" />
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} Rwf</div>
            <div className="text-gray-400">Total Revenue</div>
          </div>
          <div className="bg-[#232323] rounded-xl p-6 flex flex-col items-center shadow">
            <FiMessageSquare className="text-3xl text-[#32CD32] mb-2" />
            <div className="text-2xl font-bold">{feedbacks.length}</div>
            <div className="text-gray-400">Feedback</div>
          </div>
        </div>
        {/* Users Table */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-[#32CD32]">Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[#232323] rounded-lg">
              <thead>
                <tr className="text-left text-[#32CD32]">
                  <th className="p-1 md:p-2 text-xs md:text-base">#</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Name</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Email</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Role</th>
                  <th className="p-1 md:p-2 text-xs md:text-base">Approved</th>
                </tr>
              </thead>
              <tbody>
                {getPageData(filteredUsers).map((u, idx) => (
                  <tr key={u.id} className="border-b border-[#1A1A1A]">
                    <td className="p-1 md:p-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="p-1 md:p-2">{u.username || u.businessName}</td>
                    <td className="p-1 md:p-2">{u.email}</td>
                    <td className="p-1 md:p-2">{u.role || (u.isAdmin ? 'Admin' : 'User')}</td>
                    <td className="p-1 md:p-2">{u.approved ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} setPage={setPage} pageCount={getPageCount(filteredUsers)} />
        </div>
        {/* ...rest of dashboard tables... */}
      </>
    );
  }

  // Search bar always on top right
  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#1A1A1A] p-4 md:p-6 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start">
          <div className="mb-4 md:mb-8 text-2xl font-bold tracking-wide text-[#32CD32] w-full text-center md:text-left">
            <button
              className="hover:underline"
              onClick={() => {
                navigate('/admin');
              }}
            >
              Admin Panel
            </button>
          </div>
          <nav className="flex flex-row md:flex-col gap-2 md:gap-4 w-full justify-center md:justify-start">
            {menu.map(item => (
              <button
                key={item.label}
                className={classNames(
                  "flex items-center gap-2 md:gap-3 text-base md:text-lg transition w-full md:w-auto justify-center md:justify-start",
                  (tab === item.label.toLowerCase() || (tab === 'dashboard' && item.label === 'Dashboard'))
                    ? 'text-[#32CD32] font-bold'
                    : 'text-white hover:text-[#32CD32]'
                )}
                onClick={() => {
                  navigate(item.path);
                }}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-2 md:p-8">
          {/* Search bar on top right */}
          <div className="flex justify-end mb-4 md:mb-6">
            <div className="flex items-center bg-[#232323] rounded px-2 md:px-4 py-2 w-full max-w-md">
              <FiSearch className="text-[#32CD32] mr-2" />
              <input
                type="text"
                placeholder="Search all data..."
                className="bg-transparent outline-none text-white w-full text-base md:text-lg"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ minWidth: 120 }}
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#32CD32] mb-4 md:mb-8 capitalize">{tab === 'dashboard' ? 'Admin Dashboard' : tab}</h1>
          {loading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : (
            content
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

function Pagination({ page, setPage, pageCount }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 mt-4">
      <button
        className="p-2 rounded hover:bg-[#232323] disabled:opacity-50"
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
      >
        <FiChevronLeft />
      </button>
      <span className="font-semibold text-[#32CD32]">
        Page {page} of {pageCount}
      </span>
      <button
        className="p-2 rounded hover:bg-[#232323] disabled:opacity-50"
        onClick={() => setPage(page + 1)}
        disabled={page === pageCount}
      >
        <FiChevronRight />
      </button>
    </div>
  );
}

export default AdminDashboard;