import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiPhone, FiMail, FiPackage } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Footer from './Footer';

const BookingDetails = ({ isLoggedIn, email }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const [loading, setLoading] = useState(false);

  const userEmail = email;

  useEffect(() => {
    if (!booking) navigate(-1);
  }, [booking, navigate]);

  if (!booking) return null;

  const isFoodDelivery = Array.isArray(booking.paymentFoodDeliveries) && booking.paymentFoodDeliveries.length > 0;
  const username = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
  const userPhone = booking.phoneNumber || booking.phone || '';

  // Calculate total initial price from join tables
  const initialPriceTotal = (isFoodDelivery
    ? booking.paymentFoodDeliveries
    : booking.paymentServices
  )?.reduce((sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1), 0);

  const getWhatsappNumber = (phone) => {
    let cleaned = (phone || '').replace(/[\s-]/g, '');
    if (/^0\d{9}$/.test(cleaned)) {
      cleaned = '+250' + cleaned.slice(1);
    }
    return cleaned.replace(/\+/g, '');
  };

  const handleContact = (type) => {
    let url = '';
    if (type === 'call') url = `tel:${userPhone}`;
    if (type === 'email') {
      const subject = encodeURIComponent('Service Booking Inquiry');
      const body = encodeURIComponent('Hello, I would like to contact you regarding my booking.');
      url = `mailto:${booking.email}?subject=${subject}&body=${body}`;
    }
    if (type === 'whatsapp') url = `https://wa.me/${getWhatsappNumber(userPhone)}`;

    Swal.fire({
      title: `Contact via ${type}`,
      text: `Do you want to continue?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#32CD32',
      cancelButtonColor: '#232323',
      confirmButtonText: 'Yes',
    }).then((result) => {
      if (result.isConfirmed && url) {
        window.open(url, '_blank');
      }
    });
  };

  const handleMarkAsDone = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/payments/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Done' }),
      });
      if (!res.ok) {
        const err = await res.json();
        const msg = err.message ? (Array.isArray(err.message) ? err.message.join('\n') : err.message) : 'Failed to mark as done.';
        return Swal.fire('Error', msg, 'error');
      }
      Swal.fire('Success', 'Booking marked as done.', 'success');
      navigate(-1);
    } catch {
      Swal.fire('Error', 'Network error.', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar isLoggedIn={isLoggedIn} phone={userEmail} userName={userEmail?.split('@')[0]} serviceCategory={localStorage.getItem('userServiceCategory') || ''} />
      <div className="max-w-3xl mx-auto mt-8 p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#32CD32] text-black font-semibold hover:bg-white hover:text-[#32CD32]"
          >
            <FiArrowLeft className="text-xl" /> Back
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-2xl font-bold text-[#32CD32]">Booking Details</h2>
            <p className="text-gray-400 text-sm">View your booking and contact details.</p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl p-8 border border-[#232323] shadow-lg">
          {/* Contact Info */}
          <div className="flex items-center gap-3 mb-4">
            <FiUser className="text-[#32CD32] text-2xl" />
            <div>
              <div className="font-semibold text-lg">
                <span className="text-gray-300">Contact with </span>
                <span className="text-[#32CD32]">{username || 'Unknown'}</span>
              </div>
              <div className="text-gray-400 text-sm">{booking.email || ''}</div>
              {userPhone && <div className="text-gray-500 text-sm">{userPhone}</div>}
            </div>
          </div>

          {/* Package Table */}
          <div className="mb-4">
            <div className="font-semibold mb-1 text-[#32CD32] flex items-center gap-2">
              <FiPackage /> Package Services:
            </div>
            <table className="min-w-full bg-[#181818] mt-2 rounded border border-[#232323]">
              <thead>
                <tr className="text-[#32CD32] text-left">
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2">Quantity</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(isFoodDelivery ? booking.paymentFoodDeliveries : booking.paymentServices)?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{isFoodDelivery ? item.foodDelivery?.name : item.service?.name}</td>
                    <td className="px-3 py-2">{item.quantity || 1}</td>
                    <td className="px-3 py-2">{item.initialPrice ? `${item.initialPrice} Rwf` : '-'}</td>
                    <td className="px-3 py-2">
                      {item.initialPrice ? `${(item.initialPrice * (item.quantity || 1)).toLocaleString()} Rwf` : '-'}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td className="px-3 py-2" colSpan={4}>No items found</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-3 py-2 font-bold" colSpan={3}>Total Amount</td>
                  <td className="px-3 py-2 font-bold text-[#32CD32]">
                    {initialPriceTotal ? `${initialPriceTotal.toLocaleString()} Rwf` : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Booking Info */}
          <div className="mb-4 space-y-2 text-sm text-gray-400">
            <div><span className="text-white font-semibold">Date:</span> {new Date(booking.datetime).toLocaleString()}</div>
            <div><span className="text-white font-semibold">Status:</span> {booking.status}</div>
            <div>
              <span className="text-white font-semibold">Amount:</span>{' '}
              <span className="bg-[#32CD32] text-black font-bold px-2 py-1 rounded text-xs ml-1">
                {initialPriceTotal ? `${initialPriceTotal.toLocaleString()} Rwf` : '-'}
              </span>
            </div>
            <div><span className="text-white font-semibold">Client Prefered Location:</span> {booking.bookingLocation || '-'}</div>
          </div>

          {/* Contact Buttons */}
          <div className="mt-6">
            <div className="font-semibold mb-2 text-gray-300">
              Contact with <span className="text-[#b48a6c]">{username || 'user'}</span>
            </div>
            <div className="flex gap-4">
              <button
                className="flex items-center gap-2 bg-[#32CD32] text-black px-4 py-2 rounded font-semibold hover:bg-white hover:text-[#32CD32] transition"
                onClick={() => handleContact('call')}
                disabled={!userPhone}
              >
                <FiPhone /> Call
              </button>
              <button
                className="flex items-center gap-2 bg-[#32CD32] text-black px-4 py-2 rounded font-semibold hover:bg-white hover:text-[#32CD32] transition"
                onClick={() => handleContact('email')}
                disabled={!booking.email}
              >
                <FiMail /> Email
              </button>
              <button
                className="flex items-center gap-2 bg-[#32CD32] text-black px-4 py-2 rounded font-semibold hover:bg-white hover:text-[#32CD32] transition"
                onClick={() => handleContact('whatsapp')}
                disabled={!userPhone}
              >
                <FaWhatsapp /> WhatsApp
              </button>
            </div>
          </div>

          {/* Mark Done */}
          <div className="mt-8 flex justify-end">
            <button
              className="bg-[#b48a6c] hover:bg-[#32CD32] text-white font-semibold px-6 py-2 rounded transition"
              onClick={handleMarkAsDone}
              disabled={loading}
            >
              {loading ? 'Marking...' : 'Mark as done'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingDetails;
