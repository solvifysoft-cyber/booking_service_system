import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Swal from 'sweetalert2';
import Footer from './Footer';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Accept isLoggedIn and email as props from App.jsx
const MyServices = ({ isLoggedIn, email }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editService, setEditService] = useState(null);
  const [editForm, setEditForm] = useState({
    images: '',
    imageUrl: '',
    category: '',
    name: '',
    location: '',
    price: '',
  });
  const [imagePreview, setImagePreview] = useState('');

  // Fetch userId from session on mount
  const [userId, setUserId] = useState('');
  useEffect(() => {
    // Only fetch if not already set and logged in
    if (!userId && isLoggedIn) {
      fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.userId) setUserId(data.userId);
        });
    }
  }, [isLoggedIn, userId]);

  // Fetch services for this user
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:3000/api/v1/servises', { credentials: 'include' });
        const data = await res.json();
        const filtered = Array.isArray(data)
          ? data.filter(s => String(s.userId) === String(userId) || String(s.userEmail) === String(email))
          : [];
        setServices(filtered);
      } catch (err) {
        Swal.fire('Error', 'Failed to fetch your services.', 'error');
      }
      setLoading(false);
    };
    if (userId || email) fetchServices();
  }, [userId, email]);

  // Delete service
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete Service?',
      text: 'Are you sure you want to delete this service?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#32CD32',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });
    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/servises/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          setServices(services.filter(s => s.id !== id));
          Swal.fire('Deleted!', 'Service has been deleted.', 'success');
        } else {
          Swal.fire('Error', 'Failed to delete service.', 'error');
        }
      } catch {
        Swal.fire('Error', 'Network error.', 'error');
      }
    }
  };

  // Open edit modal with service data
  const openEditModal = (service) => {
    setEditService(service);
    setEditForm({
      images: '',
      imageUrl: service.images || '',
      category: service.category || '',
      name: service.name || '',
      location: service.location || '',
      price: service.price || '',
    });
    setImagePreview(service.images || '');
    setEditModal(true);
  };

  // Handle edit form input change (for non-image fields)
  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Handle edit form image change
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm({ ...editForm, images: file, imageUrl: '' });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Modal close
  const handleEditCancel = () => {
    setEditModal(false);
    setEditService(null);
    setImagePreview('');
  };

  // Save edited service
  const handleEditSave = async (e) => {
    e.preventDefault();
    let imagesValue = editForm.imageUrl;
    if (editForm.images) {
      const data = new FormData();
      data.append('file', editForm.images);
      try {
        const res = await fetch('http://localhost:3000/api/v1/upload', {
          method: 'POST',
          body: data,
        });
        if (!res.ok) throw new Error('Upload failed');
        const result = await res.json();
        imagesValue = result.url.split('/').pop();
      } catch {
        Swal.fire('Error', 'Image upload failed.', 'error');
        return;
      }
    }
    try {
      const updateFields = {
        images: imagesValue,
        category: editForm.category,
        name: editForm.name,
        location: editForm.location,
        price: Number(editForm.price),
      };
      const res = await fetch(`http://localhost:3000/api/v1/servises/${editService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateFields),
        credentials: 'include',
      });
      if (res.ok) {
        const updated = await res.json();
        setServices(services.map(s => s.id === editService.id ? updated : s));
        setEditModal(false);
        Swal.fire('Success', 'Service updated.', 'success');
      } else {
        let msg = 'Failed to update service.';
        try {
          const err = await res.json();
          if (err && err.message) msg = err.message;
        } catch {}
        Swal.fire('Error', msg, 'error');
      }
    } catch {
      Swal.fire('Error', 'Network error.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white relative">
      {/* Navbar with user email only (no duplicate badge) */}
  <Navbar isLoggedIn={isLoggedIn} phone={email} userName={email?.split('@')[0]} serviceCategory={localStorage.getItem('userServiceCategory') || ''} />

      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#32CD32]">My Services</h2>
          <button
            className="bg-[#32CD32] hover:bg-[#28a828] text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl"
        aria-label="Add Massage service"
        title="Add Massage Service"
        onClick={() => navigate('/add-service')}
      >
        <FaPlus />
      </button>
        </div>
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : services.length === 0 ? (
          <div className="text-center text-gray-400">No services found.</div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-[#1A1A1A] rounded-xl shadow-lg border border-[#232323] p-5 flex flex-col relative"
                style={{ width: '100%', maxWidth: '50vw', minWidth: 320 }}
              >
                <div className="flex items-center mb-2">
                  <img
                    src={service.images || '/default-user-icon.png'}
                    alt={service.name}
                    className="w-16 h-16 rounded-full border-2 border-[#32CD32] object-cover mr-3"
                  />
                  <div>
                    <div className="font-bold text-lg text-white">{service.name}</div>
                    <div className="text-gray-400 text-sm">{service.category}</div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      className="p-2 rounded-full hover:bg-[#232323] transition"
                      onClick={() => openEditModal(service)}
                      title="Edit"
                    >
                      <span role="img" aria-label="Edit"><svg width="18" height="18" style={{color:'#32CD32'}}><rect width="16" height="16" x="1" y="1" fill="none" stroke="#32CD32" strokeWidth="2" rx="4"/><path d="M5 13.5V15h1.5l6.1-6.1-1.5-1.5L5 13.5zm7.9-6.1c.198-.198.198-.518 0-.716l-1.6-1.6a.508.508 0 00-.716 0l-1.1 1.1 2.3 2.3z" fill="#32CD32"/></svg></span>
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-red-200 transition"
                      onClick={() => handleDelete(service.id)}
                      title="Delete"
                    >
                      <span role="img" aria-label="Delete"><svg width="18" height="18" style={{color:'#dc2626'}}><rect width="16" height="16" x="1" y="1" fill="none" stroke="#dc2626" strokeWidth="2" rx="4"/><path d="M6 7h6m-3-3v10" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/></svg></span>
                    </button>
                  </div>
                </div>
                <div className="text-gray-300 text-sm mb-2">{service.location}</div>
                <div className="text-gray-400 text-xs">{service.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <form
            onSubmit={handleEditSave}
            className="bg-white text-black rounded-xl w-full max-w-2xl p-8 flex flex-col items-center relative"
            style={{
              minWidth: 320,
              maxWidth: 700,
              width: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
            }}
          >
            <button
              type="button"
              onClick={handleEditCancel}
              className="absolute right-4 top-4 text-gray-400 hover:text-black text-xl"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-2 w-full text-left">Edit service</h2>
            {/* Image Upload */}
            <div className="w-full mb-4">
              <label className="block text-sm font-medium mb-1">Upload a photo showing your work:</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="border border-gray-300 rounded px-2 py-1"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
              </div>
              <input
                type="text"
                name="imageUrl"
                value={editForm.imageUrl}
                onChange={handleEditFormChange}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Or paste an image URL"
              />
            </div>
            <div className="flex flex-wrap w-full gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm mb-1 w-full text-left block">Change category</label>
                <input
                  type="text"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditFormChange}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm mb-1 w-full text-left block">Change service name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex flex-wrap w-full gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm mb-1 w-full text-left block">Change location</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm mb-1 w-full text-left block">Change price</label>
                <input
                  type="number"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditFormChange}
                  className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-[#32CD32] hover:bg-white hover:text-[#32CD32] px-6 py-2 rounded font-semibold transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyServices;