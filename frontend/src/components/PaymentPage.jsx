import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { FaShoppingCart, FaUser, FaEnvelope, FaCalendarAlt, FaPhone, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import logo from '../assets/LOGO-SERVICE.png';
import Footer from './Footer';

// Helper to calculate price + 15%
const getPriceWithFee = (price) => {
  let p = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
  if (isNaN(p)) p = 0;
  return Math.round(p * 1.15);
};

// Helper to calculate delivery fee for food delivery
const getDeliveryFee = (itemsTotal) => {
  // Always add 1000 Rwf, plus 4% if itemsTotal > 5000
  let fee = 1000;
  if (itemsTotal > 5000) {
    fee += Math.round(itemsTotal * 0.04); // 4% of items total
  }
  return fee;
};

const countryOptions = [
  { code: '+250', label: 'Rwanda (+250)' },
  { code: '+254', label: 'Kenya (+254)' },
  { code: '+256', label: 'Uganda (+256)' },
  { code: '+255', label: 'Tanzania (+255)' },
  { code: '+1', label: 'USA (+1)' },
];

// Phone validation: allow only digits, length 9 for Rwanda, etc.
const validatePhone = (phone, code) => {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (code === '+250') return /^7\d{8}$/.test(cleaned); // Rwanda: 9 digits, starts with 7
  if (code === '+254') return /^\d{9}$/.test(cleaned); // Kenya: 9 digits
  if (code === '+256') return /^\d{9}$/.test(cleaned); // Uganda: 9 digits
  if (code === '+255') return /^\d{9}$/.test(cleaned); // Tanzania: 9 digits
  if (code === '+1') return /^\d{10}$/.test(cleaned); // USA: 10 digits
  return cleaned.length > 6;
};

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Add this above PaymentPage component or inside it

const checkFoodDeliveryAvailability = async (providerId, datetime) => {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/availability/user/${providerId}`, { credentials: 'include' });
    if (!res.ok) return { available: false, reason: 'Could not check provider availability.' };
    const availabilities = await res.json();
    if (!Array.isArray(availabilities) || availabilities.length === 0) {
      return { available: false, reason: 'Provider has not set availability.' };
    }

    const bookingDate = new Date(datetime);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bookingDay = days[bookingDate.getDay()];
    const bookingTime = bookingDate.toTimeString().slice(0, 5);

    // Emergency/unavailable check
    const unavailable = availabilities.find((a) => {
      if (!a.unavailable || a.emergency) return false;
      const fromIdx = days.indexOf(a.dayFrom);
      const toIdx = days.indexOf(a.dayTo);
      const dayIdx = days.indexOf(bookingDay);
      const inDayRange =
        fromIdx <= toIdx
          ? dayIdx >= fromIdx && dayIdx <= toIdx
          : dayIdx >= fromIdx || dayIdx <= toIdx;
      const inTimeRange = bookingTime >= a.hourFrom && bookingTime <= a.hourTo;
      return inDayRange && inTimeRange;
    });
    if (unavailable) {
      return {
        available: false,
        reason: unavailable.reason
          ? `The provider is unavailable at this time: ${unavailable.reason}.`
          : 'The provider is unavailable at this time.',
      };
    }

    // Working hours check
    const workingAvailabilities = availabilities.filter(
      (a) =>
        !a.unavailable &&
        !a.emergency &&
        a.dayFrom &&
        a.dayTo &&
        a.hourFrom &&
        a.hourTo,
    );
    let isAllowedDay = false;
    let allowedTimeRanges = [];
    const dayIdx = days.indexOf(bookingDay);
    workingAvailabilities.forEach((avail) => {
      const fromIdx = days.indexOf(avail.dayFrom);
      const toIdx = days.indexOf(avail.dayTo);
      let dayIndexes = [];
      if (fromIdx <= toIdx) {
        dayIndexes = Array.from({ length: toIdx - fromIdx + 1 }, (_, i) => fromIdx + i);
      } else {
        dayIndexes = [
          ...Array.from({ length: 7 - fromIdx }, (_, i) => fromIdx + i),
          ...Array.from({ length: toIdx + 1 }, (_, i) => i),
        ];
      }
      if (dayIndexes.includes(dayIdx)) {
        isAllowedDay = true;
        allowedTimeRanges.push({
          hourFrom: avail.hourFrom,
          hourTo: avail.hourTo,
        });
      }
    });
    if (!isAllowedDay) {
      return {
        available: false,
        reason: 'The provider does not work on this day. Please select a working day.',
      };
    }
    // Check if booking time fits in any allowed time range
    const [bookingHour, bookingMinute] = bookingTime.split(':').map(Number);
    const bookingMinutes = bookingHour * 60 + bookingMinute;
    const fitsInWorkingHours = allowedTimeRanges.some((range) => {
      const [startH, startM] = range.hourFrom.split(':').map(Number);
      const [endH, endM] = range.hourTo.split(':').map(Number);
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);
      return bookingMinutes >= startMinutes && bookingMinutes <= endMinutes;
    });
    if (!fitsInWorkingHours) {
      return {
        available: false,
        reason: "The selected time is outside the provider's working hours. Please choose a valid time slot.",
      };
    }

    return { available: true };
  } catch {
    return { available: false, reason: 'Could not check provider availability.' };
  }
};

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { selectedServices, services: navServices, providerId: passedProviderId, category } = location.state || {};

  const initialServices = (selectedServices || navServices || []).filter(
    (s) =>
      s?.id &&
      s?.userId &&
      !isNaN(Number(s.id)) &&
      !isNaN(Number(s.userId)) &&
      Number(s.id) > 0 &&
      Number(s.userId) > 0
  );

  // For food delivery, allow quantity per item
  const [services, setServices] = useState(
    category === 'Food Delivery'
      ? initialServices.map(s => ({ ...s, quantity: s.quantity || 1 }))
      : initialServices.map(s => ({ ...s, quantity: s.quantity || 1 })) // allow quantity for services too
  );
  // Removed unused locationOptions state
  const [selectedLocationType, setSelectedLocationType] = useState('PROVIDER');
  const [customLocation, setCustomLocation] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    datetime: '',
    phone: '',
  });
  const [countryCode, setCountryCode] = useState(countryOptions[0].code);
  const [loading, setLoading] = useState(false);

  // Extract providerId from valid data
  const providerId = passedProviderId || (initialServices.length > 0 ? initialServices[0].userId : null);

  // Extract provider info (location, etc.)
  const provider = location.state?.provider || (initialServices.length > 0 ? initialServices[0].provider : null);

  useEffect(() => {
    if (!initialServices.length) {
      const timeout = setTimeout(() => navigate('/'), 2500);
      return () => clearTimeout(timeout);
    }
  }, [initialServices, navigate]);

  // Quantity handlers for both types
  const handleQuantityChange = (idx, delta) => {
    setServices(prev =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item
      )
    );
  };

  const handleRemove = (service) => {
    setServices((prev) => prev.filter((s) => s !== service));
  };

  const handleLocationTypeChange = (e) => {
    setSelectedLocationType(e.target.value);
    if (e.target.value !== 'CUSTOM') setCustomLocation('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAfripay = (orderId, amount) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.afripay.africa/checkout/index.php';

    const addField = (name, value) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    };

    addField('amount', amount); // This must be a number > 0
    addField('currency', 'RWF');
    addField('comment', `Order ${orderId}`);
    addField('client_token', orderId); // orderId must be your backend payment id
    addField('return_url', 'http://localhost:3001/payment-status'); // Afripay will append ?client_token=...
    addField('app_id', 'ca8462f2652470d762e0ee4aaac61051');
    addField('app_secret', 'JDJ5JDEwJFZhaVBS');

    document.body.appendChild(form);
    form.submit();
  };

  // Show payment status modal instead of redirecting to PaymentStatus.jsx
  const showPaymentStatusModal = async (paymentId) => {
    Swal.fire({
      title: '<span style="color:#32CD32;">Payment Status</span>',
      html: '<div style="color:#fff;font-size:1.1rem;">Checking payment status...</div>',
      background: '#232323',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: async () => {
        const modal = Swal.getHtmlContainer();
        let statusText = 'Checking payment status...';
        let detailsHtml = '';
        let intervalId;

        const updateStatus = async () => {
          try {
            const res = await fetch(`http://localhost:3000/api/v1/payments/${paymentId}`);
            const data = await res.json();
            if (data.status === 'paid' || data.status === 'done') {
              statusText = '<span style="color:#32CD32;">Payment successful! Thank you for your order.</span>';
            } else if (data.status === 'pending') {
              statusText = '<span style="color:#ffd700;">Payment is pending. Please wait or refresh.</span>';
            } else if (data.status === 'canceled' || data.status === 'failed') {
              statusText = '<span style="color:#ff4d4f;">Payment failed or was cancelled.</span>';
            } else {
              statusText = '<span style="color:#fff;">Could not check payment status. Please contact support.</span>';
            }
            detailsHtml = `
              <div style="margin-top:1rem;text-align:left;font-size:0.95rem;color:#ccc;">
                <div><b>Order ID:</b> ${data.id || '-'}</div>
                <div><b>Status:</b> ${data.status || '-'}</div>
                <div><b>Method:</b> ${data.paymentMethod || '-'}</div>
                <div><b>Transaction Ref:</b> ${data.transactionRef || '-'}</div>
              </div>
            `;
            modal.innerHTML = `<div style="color:#fff;font-size:1.1rem;">${statusText}</div>${detailsHtml}`;
            if (data.status === 'paid' || data.status === 'done' || data.status === 'canceled' || data.status === 'failed') {
              clearInterval(intervalId);
              Swal.update({
                showConfirmButton: true,
                confirmButtonText: 'Go to Home',
                confirmButtonColor: '#32CD32',
              });
            }
          } catch {
            modal.innerHTML = `<div style="color:#fff;font-size:1.1rem;">Could not check payment status. Please contact support.</div>`;
            clearInterval(intervalId);
            Swal.update({
              showConfirmButton: true,
              confirmButtonText: 'Go to Home',
              confirmButtonColor: '#32CD32',
            });
          }
        };

        await updateStatus();
        intervalId = setInterval(updateStatus, 5000);

        Swal.getConfirmButton().onclick = () => {
          clearInterval(intervalId);
          window.location.href = '/';
        };
      },
    });
  };

  // Show error message for invalid form inputs
  const showError = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message,
      background: '#121212',
      color: '#fff',
      confirmButtonColor: '#32CD32',
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!form.firstName || !form.lastName || !form.email || !form.datetime || !form.phone) {
      showError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (!validateEmail(form.email)) {
      showError('Invalid email address.');
      setLoading(false);
      return;
    }

    if (!validatePhone(form.phone, countryCode)) {
      showError('Invalid phone number.');
      setLoading(false);
      return;
    }

    // Check working hours for Food Delivery
    if (category === 'Food Delivery') {
      const foodItem = services && services[0];
      const foodProviderId = foodItem?.userId || providerId;
      if (foodProviderId && form.datetime) {
        const check = await checkFoodDeliveryAvailability(foodProviderId, form.datetime);
        if (!check.available) {
          Swal.fire({
            icon: 'warning',
            title: 'Unavailable',
            text: check.reason || 'Orders can only be placed during provider working days and hours. Please select a valid time.',
            background: '#121212',
            color: '#fff',
            confirmButtonColor: '#32CD32',
          });
          setLoading(false);
          return;
        }
      }
    }

    // Combine country code and phone for backend/WhatsApp
    const fullPhone = `${countryCode}${form.phone.replace(/[\s-]/g, '')}`;

    // Calculate total quantity (number of items)
    const totalQuantity = services.reduce(
      (sum, s) => sum + (s.quantity || 1),
      0
    );

    // Compose payload for backend
    const payload = {
      amount: total,
      phoneNumber: fullPhone,
      datetime: new Date(form.datetime).toISOString(),
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      userId: providerId,
      bookingLocation:
        category === 'Food Delivery'
          ? (selectedLocationType === 'DELIVERY'
              ? customLocation
              : "Provider's Location (Huye)")
          : (selectedLocationType === 'CUSTOM'
              ? customLocation
              : "Provider's Location (Huye)"),
      quantity: totalQuantity,
      ...(category === 'Food Delivery'
        ? {
            foodDeliveryItems: services.map(s => ({
              id: s.id,
              quantity: s.quantity || 1,
              initialPrice: s.price,
            }))
          }
        : {
            serviceItems: services.map(s => ({
              id: s.id,
              quantity: s.quantity || 1,
              initialPrice: getPriceWithFee(s.price),
            }))
          }
      )
    };

    try {
      const res = await fetch('http://localhost:3000/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        const totalAmount = getTotalAmount();
        if (totalAmount <= 0) {
          Swal.fire('Error', 'Total amount must be greater than zero.', 'error');
          return;
        }
        // Submit to Afripay
        handleAfripay(data.id, totalAmount);

        // After Afripay, show modal for payment status
        setTimeout(() => showPaymentStatusModal(data.id), 3000); // Wait for Afripay callback
        return;
      } else {
        Swal.fire('Payment Failed', data.message || 'Payment failed.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Payment failed: ' + (err.message || 'Network issue'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFoodItemsTotal = () => {
    return services.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) : item.price;
      return sum + (isNaN(price) ? 0 : price * (item.quantity || 1));
    }, 0);
  };

  const totalItemsOnly = getFoodItemsTotal();
  const deliveryFee = category === 'Food Delivery' ? getDeliveryFee(totalItemsOnly) : 0;

  // Update getTotalAmount to use new delivery fee logic
  const getTotalAmount = () => {
    let total = 0;
    if (Array.isArray(services) && services.length > 0) {
      if (category === 'Food Delivery') {
        total = totalItemsOnly + deliveryFee;
      } else {
        total = services.reduce((sum, item) => {
          const price = getPriceWithFee(item.price);
          return sum + (isNaN(price) ? 0 : price * (item.quantity || 1));
        }, 0);
      }
    }
    return total;
  };

  const total = getTotalAmount();

  if (services.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center px-4">
        <img src={logo} alt="Logo" className="w-36 mb-4" />
        <h2 className="text-2xl font-bold text-red-500 mb-3">No valid services selected</h2>
        <p className="mb-5 text-gray-300">Please go back and select at least one service.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#32CD32] text-black font-semibold rounded hover:bg-white hover:text-[#32CD32] transition"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const iconClass = 'absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-lg';

  // Custom radio style
  const radioStyle = {
    accentColor: '#32CD32',
    width: '22px',
    height: '22px',
    marginRight: '8px',
  };

  const labelSelectedStyle = {
    color: '#32CD32',
    fontWeight: 'bold',
  };

  const labelDefaultStyle = {
    color: '#fff',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <section className="bg-[#1A1A1A] sticky top-0 z-50 text-[#32CD32] px-2 py-3 shadow-md">
        <div className="flex items-center justify-between mb-3 max-w-3xl mx-auto w-full">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Service Logo" className="w-32 h-auto object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaShoppingCart className="text-3xl text-primary" />
              {services.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {services.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#32CD32] text-black font-semibold hover:bg-white hover:text-[#32CD32] transition"
              aria-label="Back"
            >
              <FiArrowLeft className="text-xl" />
              <span className="text-base font-bold">Back</span>
            </button>
          </div>
        </div>
        <p className="text-center text-lg font-medium text-white">
          {category === 'Food Delivery'
            ? 'Review your items and delivery details'
            : 'Confirm your selected services to complete your request.'}
        </p>
      </section>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-2 py-6">
        <div className="bg-[#1A1A1A] rounded-xl p-8 w-full max-w-3xl mx-auto shadow-lg border border-[#232323]">
          {category === 'Food Delivery' ? (
            <>
              <h2 className="text-center text-2xl font-bold mb-4 text-[#32CD32]">
                <FaShoppingCart className="inline mr-2" /> Item in Cart
              </h2>
              {/* Food Cart List */}
              <div className="mb-8">
                {services.map((item, idx) => {
                  const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) : item.price;
                  const subtotal = (isNaN(price) ? 0 : price * (item.quantity || 1));
                  return (
                    <div key={item.id} className="flex items-center py-4 border-b border-gray-700 last:border-b-0">
                      <img
                        src={
                          item.foodImage
                            ? (item.foodImage.startsWith('http')
                                ? item.foodImage
                                : `http://localhost:3000/uploads/${item.foodImage}`)
                            : '/default-user-icon.png'
                        }
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded bg-[#232323] mr-4"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-lg text-white">{item.name}</div>
                        <div className="text-[#32CD32] font-bold text-base mb-2">
                          {price.toLocaleString()} RWF x {item.quantity || 1} = {(subtotal).toLocaleString()} RWF
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="bg-[#32CD32] text-black px-2 py-1 rounded font-bold text-lg"
                            onClick={() => handleQuantityChange(idx, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus />
                          </button>
                          <input
                            type="text"
                            value={item.quantity || 1}
                            readOnly
                            className="w-10 text-center bg-[#232323] border border-gray-700 rounded text-white"
                          />
                          <button
                            type="button"
                            className="bg-[#32CD32] text-black px-2 py-1 rounded font-bold text-lg"
                            onClick={() => handleQuantityChange(idx, 1)}
                          >
                            <FaPlus />
                          </button>
                          <button
                            type="button"
                            className="ml-3 flex items-center gap-1 text-red-400 hover:text-red-600 font-semibold"
                            onClick={() => handleRemove(item)}
                          >
                            <FaTrash /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Total for items only (without delivery fee) */}
              <div className="flex justify-end items-center mb-8">
                <span className="font-bold text-lg mr-2">Total (Items Only):</span>
                <span className="text-[#32CD32] font-bold text-xl">
                  {services.reduce((sum, item) => {
                    const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) : item.price;
                    return sum + (isNaN(price) ? 0 : price * (item.quantity || 1));
                  }, 0).toLocaleString()} RWF
                </span>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-center text-2xl font-bold mb-4 text-[#32CD32]">
                <FaShoppingCart className="inline mr-2" /> Item in Cart
              </h2>
              {/* Service Cart List */}
              <div className="mb-8">
                {services.map((item, idx) => (
                  <div key={item.id} className="flex items-center py-4 border-b border-gray-700 last:border-b-0">
                    <img
                      src={
                        item.images
                          ? (Array.isArray(item.images)
                              ? item.images[0]
                              : item.images)
                          : '/default-user-icon.png'
                      }
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded bg-[#232323] mr-4"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-lg text-white">{item.name}</div>
                      <div className="text-[#32CD32] font-bold text-base mb-2">
                        {getPriceWithFee(item.price).toLocaleString()} RWF
                      </div>
                      {/* No quantity controls for service */}
                      <button
                        type="button"
                        className="ml-3 flex items-center gap-1 text-red-400 hover:text-red-600 font-semibold"
                        onClick={() => handleRemove(item)}
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Total */}
              <div className="flex justify-end items-center mb-8">
                <span className="font-bold text-lg mr-2">Total:</span>
                <span className="text-[#32CD32] font-bold text-xl">{total.toLocaleString()} RWF</span>
              </div>
            </>
          )}

          {/* Location selection for booking */}
          <div className="w-full max-w-md mb-4">
            <label className="block text-sm font-medium mb-1">
              {category === 'Food Delivery'
                ? 'Choose Delivery Option:'
                : 'Choose Service Location:'}
            </label>
            <div className="flex flex-col gap-2 bg-[#232323] p-3 rounded-md border border-gray-700">
              {category === 'Food Delivery'
                ? (
                  <>
                    <label
                      className="flex items-center gap-2 cursor-pointer"
                      style={selectedLocationType === 'PICKUP' ? labelSelectedStyle : labelDefaultStyle}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="PICKUP"
                        checked={selectedLocationType === 'PICKUP'}
                        onChange={handleLocationTypeChange}
                        style={radioStyle}
                      />
                      <span>Pick up at provider's location</span>
                    </label>
                    <label
                      className="flex items-center gap-2 cursor-pointer"
                      style={selectedLocationType === 'DELIVERY' ? labelSelectedStyle : labelDefaultStyle}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="DELIVERY"
                        checked={selectedLocationType === 'DELIVERY'}
                        onChange={handleLocationTypeChange}
                        style={radioStyle}
                      />
                      <span>Delivery to your address</span>
                    </label>
                    {selectedLocationType === 'DELIVERY' && (
                      <input
                        type="text"
                        className="w-full mt-2 px-3 py-2 border border-gray-700 rounded-md bg-[#232323] text-white"
                        placeholder="Enter your delivery address / Motel name"
                        value={customLocation}
                        onChange={e => setCustomLocation(e.target.value)}
                        required
                      />
                    )}
                  </>
                )
                : (
                  <>
                    <label
                      className="flex items-center gap-2 cursor-pointer"
                      style={selectedLocationType === 'PROVIDER' ? labelSelectedStyle : labelDefaultStyle}
                    >
                      <input
                        type="radio"
                        name="bookingLocationType"
                        value="PROVIDER"
                        checked={selectedLocationType === 'PROVIDER'}
                        onChange={handleLocationTypeChange}
                        style={radioStyle}
                      />
                      <span>At Provider's Location ({provider?.location || 'N/A'})</span>
                    </label>
                    <label
                      className="flex items-center gap-2 cursor-pointer"
                      style={selectedLocationType === 'CUSTOM' ? labelSelectedStyle : labelDefaultStyle}
                    >
                      <input
                        type="radio"
                        name="bookingLocationType"
                        value="CUSTOM"
                        checked={selectedLocationType === 'CUSTOM'}
                        onChange={handleLocationTypeChange}
                        style={radioStyle}
                      />
                      <span>Custom Location (enter your preferred address)</span>
                    </label>
                    {selectedLocationType === 'CUSTOM' && (
                      <input
                        type="text"
                        className="w-full mt-2 px-3 py-2 border border-gray-700 rounded-md bg-[#232323] text-white"
                        placeholder="Enter your preferred location"
                        value={customLocation}
                        onChange={e => setCustomLocation(e.target.value)}
                        required
                      />
                    )}
                  </>
                )
              }
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center">
            {/* First name, Last name, Email, Date, Phone */}
            {[
              {
                name: 'firstName',
                placeholder: 'First name',
                Icon: FaUser
              },
              {
                name: 'lastName',
                placeholder: 'Last name',
                Icon: FaUser
              },
              {
                name: 'email',
                placeholder: 'Email address',
                Icon: FaEnvelope,
                type: 'email'
              },
              {
                name: 'datetime',
                placeholder: 'Booking Date and Time',
                Icon: FaCalendarAlt,
                type: 'datetime-local'
              },
            ].map(({ name, placeholder, Icon, type = 'text' }) => (
              <div key={name} className="relative w-full max-w-md">
                <Icon className={iconClass} />
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-[#232323] bg-[#232323] text-white rounded placeholder-gray-400 focus:outline-none focus:border-[#32CD32]"
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}

            {/* Country code select and phone input */}
            <div className="relative w-full max-w-md flex gap-2 items-center">
              <FaPhone className={iconClass} />
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="pl-10 pr-2 py-2 border border-[#232323] bg-[#232323] text-white rounded focus:outline-none focus:border-[#32CD32]"
                style={{ minWidth: 120 }}
              >
                {countryOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="flex-1 pr-3 py-2 border border-[#232323] bg-[#232323] text-white rounded placeholder-gray-400 focus:outline-none focus:border-[#32CD32]"
                placeholder="Phone number (e.g. 781234567)"
                required
                pattern="\d{7,}"
                title="Enter a valid phone number"
              />
            </div>

            {/* Payment Details Summary */}
            <div className="w-full max-w-md border border-[#232323] rounded-lg p-4 bg-[#232323] mt-4">
              <h3 className="text-xl font-bold text-[#32CD32] mb-2 text-center">Payment Details</h3>
              <div className="mb-2">
                <div className="font-semibold mb-2">Selected Services</div>
                {services.map((s, idx) => (
                  <div key={idx} className="flex justify-between mb-2 text-sm">
                    <span>{s.name}</span>
                    <span>
                      {category === 'Food Delivery'
                        ? `${(typeof s.price === 'string' ? parseFloat(s.price.replace(/,/g, '')) : s.price).toLocaleString()} x ${s.quantity || 1}`
                        : getPriceWithFee(s.price).toLocaleString()}
                    </span>
                  </div>
                ))}
                {category === 'Food Delivery' && (
                  <div className="flex justify-between mb-2 text-sm font-semibold text-[#32CD32]">
                    <span>Delivery Fee</span>
                    <span>
                      {deliveryFee.toLocaleString()} Rwf
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold mt-2">
                  <span>Total</span>
                  <span>{total.toLocaleString()} Rwf</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              className="w-full max-w-md bg-[#32CD32] text-black py-4 px-8 rounded font-bold text-xl hover:bg-white hover:text-[#32CD32] transition"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading
                ? 'Processing...'
                : category === 'Food Delivery'
                  ? 'Confirm Order'
                  : 'Confirm Reservation'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPage;
