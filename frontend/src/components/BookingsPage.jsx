import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { FiUser, FiCalendar, FiEye, FiPackage } from 'react-icons/fi';
import { MdDone, MdPending } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

const statusColor = {
  Done: 'bg-[#32CD32] text-white px-2 py-1 rounded flex items-center gap-1',
  Due: 'bg-[#d49c7c] text-white px-2 py-1 rounded flex items-center gap-1',
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

// Accept isLoggedIn and email as props from App.jsx
const BookingsPage = ({ isLoggedIn, email }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(email || '');
  const [userId, setUserId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [hasServices, setHasServices] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const navigate = useNavigate();

  // Always fetch user info from session to get correct userId/email
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const meRes = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
        const me = await meRes.json();
        setUserEmail(me.email || email || '');
        setUserId(me.userId || '');
      } catch {
        setUserEmail(email || '');
        setUserId('');
      }
    };
    fetchUser();
    // Only run on mount or when email prop changes
    // eslint-disable-next-line
  }, [email]);

  // Fetch bookings and services for this userId
  useEffect(() => {
    const fetchBookingsAndServices = async () => {
      setLoading(true);
      setFetchError('');
      try {
        if (!userId) {
          setBookings([]);
          setHasServices(false);
          setLoading(false);
          setFetchError('User not logged in.');
          return;
        }

        // Fetch bookings for the user (try both userId and email for compatibility)
        let bookingsData = [];
        let res = await fetch(`http://localhost:3000/api/v1/payments/user/${userId}`, { credentials: 'include' });
        if (res.ok) {
          bookingsData = await res.json();
        }
        // If no bookings found, try by email (legacy support)
        if ((!Array.isArray(bookingsData) || bookingsData.length === 0) && userEmail) {
          res = await fetch(`http://localhost:3000/api/v1/payments/user-email/${encodeURIComponent(userEmail)}`, { credentials: 'include' });
          if (res.ok) {
            bookingsData = await res.json();
          }
        }
        // Filter out food delivery bookings (keep only service/massage bookings)
        const serviceBookings = Array.isArray(bookingsData)
          ? bookingsData.filter(
              b =>
                // Only include bookings that do NOT have paymentFoodDeliveries or have empty paymentFoodDeliveries
                !Array.isArray(b.paymentFoodDeliveries) ||
                b.paymentFoodDeliveries.length === 0
            )
          : [];
        setBookings(serviceBookings);

        // Fetch services for this user (to check if provider)
        let servicesData = [];
        const servicesRes = await fetch(`http://localhost:3000/api/v1/service/user/${userId}`, { credentials: 'include' });
        if (servicesRes.ok) {
          servicesData = await servicesRes.json();
        }
        setHasServices(Array.isArray(servicesData) && servicesData.length > 0);
      } catch (err) {
        setBookings([]);
        setHasServices(false);
        setFetchError('Failed to fetch your bookings. Please check your connection or try again.');
      }
      setLoading(false);
    };
    if (userId) fetchBookingsAndServices();
  }, [userId, userEmail]);

  // Filter bookings by selected date (YYYY-MM-DD)
  const filteredBookings = selectedDate
    ? bookings.filter(b => {
        const d = new Date(b.datetime);
        const ymd = d.toISOString().slice(0, 10);
        return ymd === selectedDate;
      })
    : bookings;

  const grouped = groupBookingsByDate(filteredBookings);

  // Helper to get all service names for a booking (comma separated)
  const getServiceNames = (booking) => {
    if (Array.isArray(booking.services) && booking.services.length > 0) {
      return booking.services.map(s => s.name || s.serviceName).filter(Boolean).join(', ');
    }
    return booking.serviceName || booking.name || '';
  };

  // Helper to calculate total initial price from join tables
  const getInitialPriceTotal = (booking) => {
    if (Array.isArray(booking.paymentServices) && booking.paymentServices.length > 0) {
      return booking.paymentServices.reduce(
        (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1), 0
      );
    }
    return 0;
  };

  // Handler for view button
  const handleView = (booking) => {
    navigate('/booking-details', { state: { booking } });
  };

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-400">No service bookings found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Navbar with user email only (no duplicate badge) */}
      <Navbar isLoggedIn={isLoggedIn} phone={userEmail} />

      <div className="max-w-3xl mx-auto mt-8 p-4">
        <div className="flex items-center mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#32CD32] mb-1">My Bookings</h2>
            <p className="text-gray-400 text-sm">All your service bookings in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-[#32CD32] text-xl" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-1 focus:outline-none"
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
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : fetchError ? (
          <div className="text-center py-8 text-red-400">{fetchError}</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {hasServices
              ? "You have not received any bookings yet for your services."
              : "No bookings found."}
          </div>
        ) : (
          grouped.map(({ date, bookings }) => (
            <div key={date} className="mb-8">
              <div className="font-semibold text-lg text-[#32CD32] mb-2">{date}</div>
              <div className="space-y-3">
                {bookings.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="flex items-center bg-[#181818] rounded-lg shadow border border-gray-700 px-4 py-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FiUser className="text-[#32CD32]" />
                        <span className="font-semibold">{b.firstName} {b.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-xs mb-1">
                        <FiPackage className="text-[#32CD32]" />
                        <span>{getServiceNames(b)}</span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(b.datetime).toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-xs">
                        Provider: {b.providerName || b.provider || '-'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
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
                      <span className="bg-[#32CD32] text-black font-bold px-2 py-1 rounded text-xs mt-1">
                        Paid
                      </span>
                      <span className="text-[#32CD32] font-bold">
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
      <Footer />
    </div>
  );
};

export default BookingsPage;