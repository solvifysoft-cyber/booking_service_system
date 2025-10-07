import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { FaCalendarAlt, FaClock, FaTimesCircle, FaExclamationTriangle, FaEnvelope } from 'react-icons/fa';
import Swal from 'sweetalert2';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SetAvailability = ({ isLoggedIn, email }) => {
  const [fromDay, setFromDay] = useState('Monday');
  const [toDay, setToDay] = useState('Saturday');
  const [fromHour, setFromHour] = useState('08:00');
  const [toHour, setToHour] = useState('18:00');
  const [unavailable, setUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');
  const [emergencyTime, setEmergencyTime] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyDuration, setEmergencyDuration] = useState(''); // now used as hourTo
  const [loading, setLoading] = useState(false);

  // For displaying current availability and unavailable times
  const [currentAvailability, setCurrentAvailability] = useState(null);
  const [unavailableTimes, setUnavailableTimes] = useState([]);
  const [emergencyLocks, setEmergencyLocks] = useState([]);
  const [affectedClients, setAffectedClients] = useState([]);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Always fetch the real logged-in user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' });
        const data = await res.json();
        if (data.userId) {
          setUserId(data.userId);
          setUserEmail(data.email || '');
          localStorage.setItem('userId', data.userId);
          localStorage.setItem('userEmail', data.email || '');
          sessionStorage.setItem('userId', data.userId);
          sessionStorage.setItem('userEmail', data.email || '');
        } else {
          setUserId('');
          setUserEmail('');
        }
      } catch {
        setUserId('');
        setUserEmail('');
      }
    };
    fetchUser();
  }, []);

  // Load current availability and unavailable times for the real user
  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/api/v1/availability/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const normal = data.find(a => !a.emergency);
          if (normal) {
            setFromDay(normal.dayFrom);
            setToDay(normal.dayTo);
            setFromHour(normal.hourFrom);
            setToHour(normal.hourTo);
            setUnavailable(!!normal.unavailable);
            setUnavailableMessage(normal.reason || '');
            setCurrentAvailability(normal);
          }
          setUnavailableTimes(data.filter(a => a.unavailable && !a.emergency));
          setEmergencyLocks(data.filter(a => a.emergency));
        }
      })
      .catch(() => {});
  }, [userId]);

  // Save normal availability and unavailability reason
  const handleSaveAvailability = async () => {
    setLoading(true);
    if (!userId) {
      Swal.fire('Error', 'User not logged in.', 'error');
      setLoading(false);
      return;
    }
    const payload = {
      userId: Number(userId),
      dayFrom: fromDay,
      dayTo: toDay,
      hourFrom: fromHour,
      hourTo: toHour,
      unavailable,
      reason: unavailable ? unavailableMessage : '',
      emergency: false,
    };
    try {
      const res = await fetch('http://localhost:3000/api/v1/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        Swal.fire('Error', data.message || 'Failed to save availability.', 'error');
        setLoading(false);
        return;
      }
      const data = await res.json();
      Swal.fire('Saved', data.message || 'Availability and unavailability reason saved.', 'success');
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
    setLoading(false);
  };

  // Emergency lock and notify clients
  const handleEmergencyLock = async () => {
    if (!userId) {
      Swal.fire('Error', 'User not logged in.', 'error');
      return;
    }
    if (!emergencyTime || !emergencyDuration || !emergencyReason) {
      Swal.fire('Error', 'Please fill start time, end time, and reason.', 'error');
      return;
    }
    setLoading(true);
    try {
      // Calculate duration in minutes
      const start = new Date(emergencyTime);
      const end = new Date(emergencyDuration);
      const duration = Math.max(0, Math.round((end - start) / 60000)); // duration in minutes

      if (duration <= 0) {
        Swal.fire('Error', 'End time must be after start time.', 'error');
        setLoading(false);
        return;
      }

      const payload = {
        userId: Number(userId),
        dayFrom: '', // Not needed for emergency
        dayTo: '',
        hourFrom: emergencyTime,
        hourTo: emergencyDuration,
        unavailable: true,
        reason: emergencyReason,
        emergency: true,
        duration, // <-- send correct duration
      };
      const res = await fetch('http://localhost:3000/api/v1/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to lock emergency time');
      const affected = await res.json();
      setAffectedClients(affected.affectedClients || []);
      Swal.fire('Emergency Set', 'Emergency time locked and clients will be notified.', 'info');
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
    setLoading(false);
  };

  // (Optional) Message affected clients
  const handleMessageClients = async () => {
    if (!affectedClients.length) return;
    Swal.fire('Message Sent', 'Clients have been notified about the emergency closure.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <Navbar isLoggedIn={true} phone={userEmail || email} />
      <div className="max-w-xl mx-auto mt-10 p-4 w-full">
        <div className="bg-[#1A1A1A] rounded-xl p-8 shadow-lg border border-[#232323]">
          <h2 className="text-2xl font-bold text-[#32CD32] mb-6 flex items-center gap-2">
            <FaCalendarAlt /> Manage Availability
          </h2>

          {/* Display current availability */}
          {currentAvailability && (
            <div className="mb-6 p-4 rounded bg-[#232323] border border-[#32CD32]">
              <div className="font-semibold mb-1 text-[#32CD32]">Current Availability:</div>
              <div>
                <span className="font-bold">Days:</span> {currentAvailability.dayFrom} to {currentAvailability.dayTo}
              </div>
              <div>
                <span className="font-bold">Hours:</span> {currentAvailability.hourFrom} - {currentAvailability.hourTo}
              </div>
              {currentAvailability.unavailable && (
                <div className="mt-2 text-red-400 flex items-center gap-2">
                  <FaTimesCircle /> Unavailable: {currentAvailability.reason}
                </div>
              )}
            </div>
          )}

          {/* Display unavailable times */}
          {unavailableTimes.length > 0 && (
            <div className="mb-6">
              <div className="font-semibold mb-1 text-[#32CD32]">Unavailable Times:</div>
              <ul className="list-disc list-inside text-red-400 text-sm">
                {unavailableTimes.map((u, idx) => (
                  <li key={u.id || idx}>
                    {u.dayFrom} to {u.dayTo}, {u.hourFrom}-{u.hourTo}
                    {u.reason && <> — <span className="italic">{u.reason}</span></>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Display emergency locks */}
          {emergencyLocks.length > 0 && (
            <div className="mb-6">
              <div className="font-semibold mb-1 text-red-400 flex items-center gap-2">
                <FaExclamationTriangle /> Emergency Closures:
              </div>
              <ul className="list-disc list-inside text-red-400 text-sm">
                {emergencyLocks.map((e, idx) => (
                  <li key={e.id || idx}>
                    {e.hourFrom}
                    {e.duration && <> ({e.duration} min)</>}
                    {e.reason && <> — <span className="italic">{e.reason}</span></>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Set weekly availability */}
          <form className="space-y-6">
            <div>
              <div className="font-semibold mb-2">Working Days</div>
              <div className="flex gap-4 mb-4">
                <label className="flex flex-col text-sm font-medium">
                  From
                  <select
                    className="mt-1 bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-2"
                    value={fromDay}
                    onChange={(e) => setFromDay(e.target.value)}
                  >
                    {days.map((day) => (
                      <option key={day}>{day}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm font-medium">
                  To
                  <select
                    className="mt-1 bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-2"
                    value={toDay}
                    onChange={(e) => setToDay(e.target.value)}
                  >
                    {days.map((day) => (
                      <option key={day}>{day}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="font-semibold mb-2 flex items-center gap-2">
                <FaClock /> Working Hours
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-sm">
                  From:
                  <input
                    type="time"
                    value={fromHour}
                    onChange={(e) => setFromHour(e.target.value)}
                    className="bg-[#232323] border border-[#32CD32] text-white rounded px-2 py-1"
                  />
                </label>
                <label className="flex items-center gap-1 text-sm">
                  To:
                  <input
                    type="time"
                    value={toHour}
                    onChange={(e) => setToHour(e.target.value)}
                    className="bg-[#232323] border border-[#32CD32] text-white rounded px-2 py-1"
                  />
                </label>
              </div>
            </div>

            {/* Unavailability toggle and reason */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={unavailable}
                  onChange={e => setUnavailable(e.target.checked)}
                  id="unavailable-toggle"
                  className="accent-[#32CD32] w-4 h-4"
                />
                <label htmlFor="unavailable-toggle" className="font-semibold text-red-400 flex items-center gap-2">
                  <FaTimesCircle /> Mark as unavailable for some time
                </label>
              </div>
              {unavailable && (
                <textarea
                  value={unavailableMessage}
                  onChange={(e) => setUnavailableMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-2"
                  placeholder="Explain why you're not available at some times (e.g., holidays, off day)..."
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveAvailability}
              className="w-full bg-[#32CD32] hover:bg-white hover:text-[#32CD32] text-black py-2 rounded font-bold"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Availability Settings'}
            </button>
          </form>

          {/* Emergency Lock Section */}
          <div className="mt-10 border-t border-[#333] pt-6">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <FaExclamationTriangle /> Emergency Closure
            </h3>
            <div className="space-y-4">
              {/* Updated: Set hourFrom and hourTo as date & time for emergency */}
              <div className="flex gap-4">
                <label className="block text-sm flex-1">
                  Start (Date & Time, hourFrom):
                  <input
                    type="datetime-local"
                    value={emergencyTime}
                    onChange={(e) => setEmergencyTime(e.target.value)}
                    className="w-full mt-1 bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-2"
                  />
                </label>
                <label className="block text-sm flex-1">
                  End (Date & Time, hourTo):
                  <input
                    type="datetime-local"
                    value={emergencyDuration}
                    onChange={(e) => setEmergencyDuration(e.target.value)}
                    className="w-full mt-1 bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-2"
                  />
                </label>
              </div>
              <label className="block text-sm">
                Reason for emergency lock:
                <textarea
                  rows={2}
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full mt-1 bg-[#232323] border border-[#32CD32] text-white rounded px-3 py-2"
                  placeholder="Explain emergency reason (e.g., urgent travel, health issue)"
                />
              </label>
              <button
                type="button"
                onClick={handleEmergencyLock}
                className="w-full bg-[#b48a6c] hover:bg-[#32CD32] hover:text-black text-white py-2 rounded font-bold"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Lock Emergency Time & Notify Clients'}
              </button>
            </div>
            {/* Optional: Message affected clients */}
            {affectedClients.length > 0 && (
              <div className="mt-6">
                <div className="font-semibold mb-2 flex items-center gap-2 text-[#32CD32]">
                  <FaEnvelope /> Clients to notify:
                </div>
                <ul className="list-disc list-inside text-white text-sm mb-2">
                  {affectedClients.map((c, idx) => (
                    <li key={c.id || idx}>{c.email || c.name || c.phone}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleMessageClients}
                  className="w-full bg-[#32CD32] hover:bg-white hover:text-[#32CD32] text-black py-2 rounded font-bold"
                >
                  Message All Clients
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SetAvailability;