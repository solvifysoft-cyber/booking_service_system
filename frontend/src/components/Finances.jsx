import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import Navbar from './Navbar';
import { FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaCalendar } from 'react-icons/fa';
import Footer from './Footer';
import Swal from 'sweetalert2';

const TooltipPortal = ({ children, position, visible }) => {
  if (!visible) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        zIndex: 9999,
        background: '#fff',
        color: '#222',
        borderRadius: 8,
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        padding: 16,
        minWidth: 260,
        maxWidth: 340,
        fontSize: 15,
        pointerEvents: 'auto',
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const Finances = ({ isLoggedIn, email }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeQuick, setActiveQuick] = useState('');
  const [customActive, setCustomActive] = useState(false);
  const [paymentType, setPaymentType] = useState('all');

  // Use email from props, do not fetch/set again
  const userEmail = email;

  // Fetch userId and payments
  useEffect(() => {
    const fetchSessionAndPayments = async () => {
      setLoading(true);
      try {
        let sessionUserId = userId;
        if (!sessionUserId) {
          const meRes = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
          const me = await meRes.json();
          sessionUserId = me.userId || '';
          setUserId(sessionUserId);
        }
        if (!sessionUserId) {
          setPayments([]);
          setLoading(false);
          return;
        }
        // Fetch payments for this user, including join tables
        const res = await fetch(`http://localhost:3000/api/v1/payments/user/${sessionUserId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPayments(Array.isArray(data) ? data : []);
        } else {
          setPayments([]);
        }
      } catch (err) {
        setPayments([]);
        Swal.fire('Error', err.message || 'Failed to fetch your payments.', 'error');
      }
      setLoading(false);
    };
    fetchSessionAndPayments();
    // eslint-disable-next-line
  }, [userEmail]);

  const today = new Date();
  const formatDate = (d) => d.toISOString().slice(0, 10);

  const handleQuick = (type) => {
    setActiveQuick(type);
    setCustomActive(false);
    let fromDate = '';
    let toDate = formatDate(today);
    if (type === 'day') {
      fromDate = toDate;
    } else if (type === 'week') {
      const first = new Date(today);
      first.setDate(today.getDate() - today.getDay());
      fromDate = formatDate(first);
    } else if (type === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      fromDate = formatDate(first);
    } else if (type === 'year') {
      const first = new Date(today.getFullYear(), 0, 1);
      fromDate = formatDate(first);
    }
    setFrom(fromDate);
    setTo(toDate);
  };

  const clearFilter = () => {
    setFrom('');
    setTo('');
    setActiveQuick('');
    setCustomActive(false);
  };

  // Filtering logic
  const filteredPayments = payments
    .filter(p => p.status?.toLowerCase() === 'done')
    .filter((p) => {
      // Date filter logic (if any)
      const dateStr = p.createdAt;
      if (!dateStr) return false;
      const date = new Date(dateStr).toISOString().slice(0, 10);
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    })
    .filter((p) => {
      if (paymentType === 'service') {
        // Only service bookings (no food deliveries)
        return Array.isArray(p.paymentServices) && p.paymentServices.length > 0;
      }
      if (paymentType === 'food') {
        // Only food delivery bookings
        return Array.isArray(p.paymentFoodDeliveries) && p.paymentFoodDeliveries.length > 0;
      }
      return true; // 'all'
    });

  // Helper to calculate total initial price from join tables
  const getInitialPriceTotal = (payment) => {
    if (Array.isArray(payment.paymentFoodDeliveries) && payment.paymentFoodDeliveries.length > 0) {
      return payment.paymentFoodDeliveries.reduce(
        (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1), 0
      );
    }
    if (Array.isArray(payment.paymentServices) && payment.paymentServices.length > 0) {
      return payment.paymentServices.reduce(
        (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1), 0
      );
    }
    return 0;
  };

  // Calculate totals using initial price
  const totalAmount = payments.reduce((sum, p) => sum + getInitialPriceTotal(p), 0);

  let filterInfo = '';
  if (activeQuick === 'day') filterInfo = `Showing payments for Today (${from})`;
  else if (activeQuick === 'week') filterInfo = `Showing payments for This Week (${from} to ${to})`;
  else if (activeQuick === 'month') filterInfo = `Showing payments for This Month (${from} to ${to})`;
  else if (activeQuick === 'year') filterInfo = `Showing payments for This Year (${from} to ${to})`;
  else if (customActive && from && to) filterInfo = `Showing payments from ${from} to ${to}`;

  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, payment: null, position: { left: 0, top: 0 } });
  const rowRefs = useRef([]);

  // Tooltip content: show all details using join tables and initial prices
  const renderTooltip = (p) => {
    const isFood = Array.isArray(p.paymentFoodDeliveries) && p.paymentFoodDeliveries.length > 0;
    const items = isFood ? p.paymentFoodDeliveries : p.paymentServices;
    return (
      <div>
        <div><b>Client Name:</b> {p.firstName} {p.lastName}</div>
        <div><b>Phone:</b> {p.phoneNumber || p.phone || '-'}</div>
        <div><b>Email:</b> {p.email || '-'}</div>
        <div className="mt-2 mb-1 font-semibold text-[#32CD32]">Items:</div>
        <table className="min-w-[180px] bg-[#f4f4f4] rounded border border-[#232323] text-xs mb-2">
          <thead>
            <tr className="text-[#32CD32] text-left">
              <th className="px-2 py-1">Item</th>
              <th className="px-2 py-1">Qty</th>
              <th className="px-2 py-1">Initial Price</th>
              <th className="px-2 py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, i) => (
              <tr key={i}>
                <td className="px-2 py-1">{isFood ? item.foodDelivery?.name : item.service?.name}</td>
                <td className="px-2 py-1">{item.quantity || 1}</td>
                <td className="px-2 py-1">{item.initialPrice ? `${item.initialPrice} Rwf` : '-'}</td>
                <td className="px-2 py-1">
                  {item.initialPrice ? `${(item.initialPrice * (item.quantity || 1)).toLocaleString()} Rwf` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="px-2 py-1 font-bold" colSpan={3}>Total</td>
              <td className="px-2 py-1 font-bold text-[#32CD32]">
                {getInitialPriceTotal(p).toLocaleString()} Rwf
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // Tooltip handlers
  const handleShowTooltip = (idx, payment, event) => {
    const rect = rowRefs.current[idx]?.getBoundingClientRect();
    let left = rect ? rect.right + 10 : event.clientX + 10;
    let top = rect ? rect.top : event.clientY;
    // Adjust if tooltip would go off right edge
    const tooltipWidth = 340;
    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - 20;
    }
    // Adjust if tooltip would go off bottom edge
    const tooltipHeight = 180;
    if (top + tooltipHeight > window.innerHeight) {
      top = window.innerHeight - tooltipHeight - 20;
    }
    setTooltip({ visible: true, payment, position: { left, top } });
  };

  const handleHideTooltip = () => {
    setTooltip({ visible: false, payment: null, position: { left: 0, top: 0 } });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar isLoggedIn={isLoggedIn} phone={email} />

      <div className="max-w-5xl mx-auto mt-10 p-4">
        <h2 className="text-2xl font-bold text-[#32CD32] mb-6">My Payments</h2>

        {filterInfo && (
          <div className="mb-3 text-[#32CD32] font-semibold text-lg">{filterInfo}</div>
        )}

        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
          <div className="flex-1">
            <h4 className="text-base font-semibold text-white mb-2">Filtered by Category</h4>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => handleQuick('day')} className={`flex items-center gap-1 px-4 py-2 rounded font-semibold text-sm ${activeQuick === 'day' ? 'bg-[#32CD32] text-black' : 'bg-[#232323] text-white hover:bg-[#32CD32] hover:text-black'}`}><FaCalendarDay /> Today</button>
              <button onClick={() => handleQuick('week')} className={`flex items-center gap-1 px-4 py-2 rounded font-semibold text-sm ${activeQuick === 'week' ? 'bg-[#32CD32] text-black' : 'bg-[#232323] text-white hover:bg-[#32CD32] hover:text-black'}`}><FaCalendarWeek /> This Week</button>
              <button onClick={() => handleQuick('month')} className={`flex items-center gap-1 px-4 py-2 rounded font-semibold text-sm ${activeQuick === 'month' ? 'bg-[#32CD32] text-black' : 'bg-[#232323] text-white hover:bg-[#32CD32] hover:text-black'}`}><FaCalendarAlt /> This Month</button>
              <button onClick={() => handleQuick('year')} className={`flex items-center gap-1 px-4 py-2 rounded font-semibold text-sm ${activeQuick === 'year' ? 'bg-[#32CD32] text-black' : 'bg-[#232323] text-white hover:bg-[#32CD32] hover:text-black'}`}><FaCalendar /> This Year</button>
              <button onClick={clearFilter} className="px-4 py-2 rounded bg-[#b48a6c] text-white font-semibold hover:bg-white hover:text-[#b48a6c] text-sm">Clear</button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-end">
            <h4 className="text-base font-semibold text-white mb-8">Customize Filter</h4>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="font-semibold text-white">From:</span>
                <input
                  type="date"
                  value={from}
                  onChange={e => {
                    setFrom(e.target.value);
                    setCustomActive(true);
                    setActiveQuick('');
                  }}
                  className="bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-1 focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="font-semibold text-white">To:</span>
                <input
                  type="date"
                  value={to}
                  onChange={e => {
                    setTo(e.target.value);
                    setCustomActive(true);
                    setActiveQuick('');
                  }}
                  className="bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-1 focus:outline-none"
                />
              </label>
              {(from || to) && (
                <button
                  className="ml-2 text-[#32CD32] hover:underline text-sm"
                  onClick={clearFilter}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment type filter buttons */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded font-semibold ${paymentType === 'all' ? 'bg-[#32CD32] text-black' : 'bg-[#232323] text-white hover:bg-[#32CD32] hover:text-black'}`}
            onClick={() => setPaymentType('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold ${paymentType === 'service' ? 'bg-[#32CD32] text-black' : 'bg-[#232323] text-white hover:bg-[#32CD32] hover:text-black'}`}
            onClick={() => setPaymentType('service')}
          >
            Service Bookings
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold ${paymentType === 'food' ? 'bg-[#32CD32] text-black' : 'bg-[#232323] text-white hover:bg-[#32CD32] hover:text-black'}`}
            onClick={() => setPaymentType('food')}
          >
            Food Delivery
          </button>
        </div>

        <div className="mb-4 text-xl font-bold">
          Total: <span className="text-[#32CD32]">{totalAmount.toLocaleString()} Rwf</span>
          <span className="text-sm text-gray-400 ml-4">({filteredPayments.length} transactions)</span>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[#1A1A1A] rounded shadow border border-[#232323]">
              <thead>
                <tr className="bg-[#32CD32] text-white">
                  <th className="px-3 py-2 text-left">Client Name</th>
                  <th className="px-3 py-2 text-left">Amount (Rwf)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center text-gray-400 py-4">No payments found.</td>
                  </tr>
                ) : (
                  filteredPayments.map((p, idx) => (
                    <tr
                      key={p.id || idx}
                      ref={el => rowRefs.current[idx] = el}
                      onMouseEnter={e => handleShowTooltip(idx, p, e)}
                      onMouseLeave={handleHideTooltip}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="px-3 py-2">{p.firstName} {p.lastName}</td>
                      <td className="px-3 py-2 font-bold">{getInitialPriceTotal(p).toLocaleString()} Rwf</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <TooltipPortal
              visible={tooltip.visible}
              position={tooltip.position}
            >
              {tooltip.payment && renderTooltip(tooltip.payment)}
            </TooltipPortal>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default Finances;