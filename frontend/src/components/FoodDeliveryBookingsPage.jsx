import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiCalendar, FiEye, FiPackage } from 'react-icons/fi';
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
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user info to get userId
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
        const me = await res.json();
        setUserId(me.userId || '');
      } catch {
        setUserId('');
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

  // Handler for view button
  const handleView = (booking) => {
    navigate('/booking-details', { state: { booking } });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar isLoggedIn={isLoggedIn} phone={email} />
      <div className="max-w-3xl mx-auto mt-8 p-4">
        <div className="flex items-center mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#32CD32] mb-1">My Food Delivery Bookings</h2>
            <p className="text-gray-400 text-sm">All your food delivery bookings in one place.</p>
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
        ) : grouped.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No food delivery bookings found.
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
                        <span>
                          {Array.isArray(b.foodDeliveries) && b.foodDeliveries.length > 0
                            ? b.foodDeliveries.map(f => f.name).filter(Boolean).join(', ')
                            : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-1">
                        {Array.isArray(b.foodDeliveries) && b.foodDeliveries.map(food => (
                          <div key={food.id} className="flex items-center gap-2 bg-[#232323] rounded p-1">
                            {food.foodImage && (
                              <img
                                src={
                                  food.foodImage.startsWith('http')
                                    ? food.foodImage
                                    : `http://localhost:3000/uploads/${food.foodImage}`
                                }
                                alt={food.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-xs">{food.name}</div>
                              <div className="text-xs text-gray-400">{food.category}</div>
                              <div className="text-[#32CD32] font-bold text-xs">{food.price.toLocaleString()} RWF</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(b.datetime).toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-xs">
                        Delivery Address: <span className="text-white">{b.bookingLocation}</span>
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

export default FoodDeliveryBookingsPage;