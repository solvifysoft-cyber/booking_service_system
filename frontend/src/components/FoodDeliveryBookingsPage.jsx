import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiCalendar, FiEye, FiPackage, FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import { MdDone, MdPending } from 'react-icons/md';

const statusColor = {
  Done: 'bg-[#32CD32] text-white px-2 py-1 rounded flex items-center gap-1',
  Due: 'bg-[#d49c7c] text-white px-2 py-1 rounded flex items-center gap-1',
};

// Helper to calculate total initial price from join table
const getInitialPriceTotal = (booking) => {
  if (Array.isArray(booking.paymentFoodDeliveries) && booking.paymentFoodDeliveries.length > 0) {
    return booking.paymentFoodDeliveries.reduce(
      (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1), 0
    );
  }
  return 0;
};

function groupBookingsByDate(bookings) {
  const groups = {};
  bookings.forEach((b) => {
    const date = new Date(b.datetime).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(b);
  });
  return Object.entries(groups).map(([date, bookings]) => ({ date, bookings }));
}

const FoodDeliveryBookingsPage = ({ isLoggedIn, email }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user info to get userId and business name
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
        const me = await res.json();
        setUserId(me.userId || '');
        setUserInfo(me);
      } catch {
        setUserId('');
        setUserInfo(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/v1/payments/food-delivery/user/${userId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setBookings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  // Filter bookings by selected date (YYYY-MM-DD)
  const filteredBookings = selectedDate
    ? bookings.filter(b => {
        const d = new Date(b.datetime);
        const ymd = d.toISOString().slice(0, 10);
        return ymd === selectedDate;
      })
    : bookings;

  const grouped = groupBookingsByDate(filteredBookings);

  // Dashboard calculations
  const calculateDashboardMetrics = () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.datetime).toISOString().slice(0, 10);
      return bookingDate === todayStr;
    });

    const upcomingBookings = bookings.filter(b => {
      const bookingDate = new Date(b.datetime);
      return bookingDate > today && b.status !== 'Done';
    });

    const totalAmountToday = todayBookings.reduce((sum, b) => sum + getInitialPriceTotal(b), 0);
    const amountEarnedToday = todayBookings
      .filter(b => b.status === 'Done')
      .reduce((sum, b) => sum + getInitialPriceTotal(b), 0);
    const amountDue = bookings
      .filter(b => b.status !== 'Done')
      .reduce((sum, b) => sum + getInitialPriceTotal(b), 0);

    return {
      totalBookings: bookings.length,
      todayBookings: todayBookings.length,
      upcomingBookings: upcomingBookings.length,
      totalAmountToday,
      amountEarnedToday,
      amountDue
    };
  };

  const metrics = calculateDashboardMetrics();

  // Handler for view button
  const handleView = (booking) => {
    navigate('/booking-details', { state: { booking } });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar isLoggedIn={isLoggedIn} phone={email} userName={userInfo?.username || userInfo?.businessName} serviceCategory={localStorage.getItem('userServiceCategory') || ''} />
      
      {/* Dashboard Header */}
      <div className="max-w-7xl mx-auto mt-8 p-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#32CD32] mb-2">Food Delivery Dashboard</h1>
            {userInfo?.businessName && (
              <p className="text-xl text-gray-300">Welcome, {userInfo.businessName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-[#32CD32] text-xl" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-2 focus:outline-none"
              style={{ minWidth: 140 }}
            />
            {selectedDate && (
              <button
                className="ml-2 text-[#32CD32] hover:underline text-sm"
                onClick={() => setSelectedDate('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {/* Total Bookings */}
          <div className="bg-[#181818] rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{metrics.totalBookings}</p>
              </div>
              <FiPackage className="text-[#32CD32] text-2xl" />
            </div>
          </div>

          {/* Today's Bookings */}
          <div className="bg-[#181818] rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Today's Bookings</p>
                <p className="text-2xl font-bold text-white">{metrics.todayBookings}</p>
              </div>
              <FiCalendar className="text-[#32CD32] text-2xl" />
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-[#181818] rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Upcoming</p>
                <p className="text-2xl font-bold text-white">{metrics.upcomingBookings}</p>
              </div>
              <FiClock className="text-[#32CD32] text-2xl" />
            </div>
          </div>

          {/* Total Amount Today */}
          <div className="bg-[#181818] rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Today</p>
                <p className="text-2xl font-bold text-white">{metrics.totalAmountToday.toLocaleString()}</p>
                <p className="text-xs text-gray-500">RWF</p>
              </div>
              <FiDollarSign className="text-[#32CD32] text-2xl" />
            </div>
          </div>

          {/* Amount Earned Today */}
          <div className="bg-[#181818] rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Earned Today</p>
                <p className="text-2xl font-bold text-white">{metrics.amountEarnedToday.toLocaleString()}</p>
                <p className="text-xs text-gray-500">RWF</p>
              </div>
              <FiCheckCircle className="text-[#32CD32] text-2xl" />
            </div>
          </div>

          {/* Amount Due */}
          <div className="bg-[#181818] rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Amount Due</p>
                <p className="text-2xl font-bold text-white">{metrics.amountDue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">RWF</p>
              </div>
              <FiTrendingUp className="text-[#32CD32] text-2xl" />
            </div>
          </div>
        </div>

        {/* Bookings List Section */}
        <div className="bg-[#181818] rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-[#32CD32] mb-6">Recent Bookings</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No food delivery bookings found.
            </div>
          ) : (
            grouped.map(({ date, bookings }) => (
              <div key={date} className="mb-8">
                <div className="font-semibold text-lg text-[#32CD32] mb-4">{date}</div>
                <div className="space-y-4">
                  {bookings.map((b, idx) => (
                    <div
                      key={b.id || idx}
                      className="flex items-center bg-[#232323] rounded-lg shadow border border-gray-600 px-4 py-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FiUser className="text-[#32CD32]" />
                          <span className="font-semibold text-lg">{b.firstName} {b.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
                          <FiPackage className="text-[#32CD32]" />
                          <span>
                            {Array.isArray(b.foodDeliveries) && b.foodDeliveries.length > 0
                              ? b.foodDeliveries.map(f => f.name).filter(Boolean).join(', ')
                              : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {Array.isArray(b.foodDeliveries) && b.foodDeliveries.map(food => (
                            <div key={food.id} className="flex items-center gap-2 bg-[#181818] rounded p-2">
                              {food.foodImage && (
                                <img
                                  src={
                                    food.foodImage.startsWith('http')
                                      ? food.foodImage
                                      : `http://localhost:3000/uploads/${food.foodImage}`
                                  }
                                  alt={food.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-semibold text-sm">{food.name}</div>
                                <div className="text-xs text-gray-400">{food.category}</div>
                                <div className="text-[#32CD32] font-bold text-sm">{food.price.toLocaleString()} RWF</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-gray-400 text-sm mb-1">
                          {new Date(b.datetime).toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Delivery Address: <span className="text-white">{b.bookingLocation}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className={statusColor[b.status] || statusColor['Due']}>
                          {b.status === 'Done' ? (
                            <>
                              <MdDone className="inline" /> Done
                            </>
                          ) : (
                            <>
                              <MdPending className="inline" /> Due
                            </>
                          )}
                        </span>
                        <span className="bg-[#32CD32] text-black font-bold px-3 py-1 rounded text-sm">
                          Paid
                        </span>
                        <span className="text-[#32CD32] font-bold text-lg">
                          {getInitialPriceTotal(b).toLocaleString()} Rwf
                        </span>
                        <button
                          className="flex items-center gap-1 text-[#32CD32] hover:underline text-sm mt-1"
                          onClick={() => handleView(b)}
                          title="View details"
                        >
                          <FiEye /> View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FoodDeliveryBookingsPage;