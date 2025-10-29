import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Swal from 'sweetalert2';
import Footer from './Footer';
import { FaTag, FaImage, FaFileAlt, FaMoneyBill, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const AddService = ({ isLoggedIn, email }) => {
  const [formData, setFormData] = useState({
    category: '',
    serviceName: '',
    images: null,
    imageUrl: '',
    price: '',
    location: '',
    description: '',
    duration: '',
    locationType: '',
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');
  const navigate = useNavigate();

  // Use email prop for userEmail
  const userEmail = email;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images' && files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        images: files[0],
        imageUrl: '',
      }));
      setPreview(URL.createObjectURL(files[0]));
    } else if (name === 'imageUrl') {
      setFormData((prev) => ({
        ...prev,
        imageUrl: value,
        images: null,
      }));
      setPreview(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLocationTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      locationType: e.target.value,
      location: e.target.value === 'PROVIDER' ? '' : prev.location,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let imagesValue = '';
    if (formData.images) {
      const data = new FormData();
      data.append('file', formData.images);
      try {
        const res = await fetch('http://localhost:3000/api/v1/upload', {
          method: 'POST',
          body: data,
        });
        if (!res.ok) throw new Error('Upload failed');
        const result = await res.json();
        imagesValue = result.url.split('/').pop();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Image Upload Failed',
          text: 'Could not upload image. Try again.',
        });
        setLoading(false);
        return;
      }
    } else if (formData.imageUrl && formData.imageUrl.trim() !== '') {
      imagesValue = formData.imageUrl.trim();
    } else {
      imagesValue = '';
    }

    const durationInt = parseInt(formData.duration, 10);
    if (isNaN(durationInt) || durationInt <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Duration',
        text: 'Please enter a valid duration in minutes (e.g., 90 for 1h 30min).',
      });
      setLoading(false);
      return;
    }

    if (!formData.locationType) {
      Swal.fire({
        icon: 'error',
        title: 'Location Type Required',
        text: 'Please select at least one service location type.',
      });
      setLoading(false);
      return;
    }

    if ((formData.locationType === 'CUSTOM' || formData.locationType === 'HYBRID') && !formData.location.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Location Required',
        text: 'Please enter a custom location for your service.',
      });
      setLoading(false);
      return;
    }

    const payload = {
      category: formData.category,
      name: formData.serviceName,
      images: imagesValue,
      price: parseFloat(formData.price),
      location: formData.location,
      locationType: formData.locationType,
      description: formData.description,
      duration: durationInt,
      userEmail,
    };

    try {
      const response = await fetch('http://localhost:3000/api/v1/servises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        let msg = 'Failed to publish service. Please check your input or try again later.';
        try {
          const data = await response.json();
          if (data && data.message) {
            if (
              data.message.includes('Unique constraint failed') ||
              data.message.includes('already exists') ||
              data.message.includes('P2002')
            ) {
              msg = 'A service with this name or email already exists.';
            } else if (data.message.toLowerCase().includes('image')) {
              msg = 'There was a problem with your image. Please provide a valid image URL.';
            } else {
              msg = data.message;
            }
          }
        } catch {}
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: msg,
        });
        setLoading(false);
        return;
      }

      Swal.fire({
        title: 'Success',
        text: 'Service Published! View your services now?',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Go to My Services',
        cancelButtonText: 'Stay Here',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/my-services');
        }
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Network error. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const iconClass = "absolute left-3 top-1/2 transform -translate-y-1/2 text-[#32CD32] text-lg";

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
  {/* Navbar with user email only (no duplicate badge) */}
  <Navbar isLoggedIn={isLoggedIn} phone={email} userName={email?.split('@')[0]} serviceCategory={localStorage.getItem('userServiceCategory') || ''} />

      <main className="flex-1 flex items-center justify-center px-2 py-6">
        <div className="bg-[#1A1A1A] rounded-xl p-8 w-full max-w-lg mx-auto shadow-lg relative border border-[#232323]">
          <button
            className="absolute left-4 top-4 text-2xl text-[#b48a6c] hover:text-[#32CD32]"
            onClick={handleBack}
            aria-label="Back"
          >
            <FaTag />
          </button>
          <h1 className="text-3xl font-bold text-center text-[#32CD32] mb-2">Add New Service</h1>
          <p className="text-gray-300 text-center mb-6 text-sm leading-relaxed">
            Logged in as: <span className="text-[#32CD32] font-semibold">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center">
            <div className="relative w-full max-w-md">
              <FaTag className={iconClass} />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full max-w-md pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:border-[#32CD32] bg-[#2A2A2A] text-white"
              >
                <option value="">-- Select Category --</option>
                <option value="Massage">Massage</option>
              </select>
            </div>

            <div className="relative w-full max-w-md">
              <FaTag className={iconClass} />
              <input
                type="text"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                required
                className="w-full max-w-md pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:border-[#32CD32] bg-[#2A2A2A] text-white"
                placeholder="Enter your service name"
              />
            </div>

            <div className="w-full max-w-md">
              <label className="block text-sm font-medium mb-1">Upload a photo showing your work:</label>
              <div className="flex flex-col items-center gap-2">
                <label className="cursor-pointer flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-[#32CD32] rounded-xl text-[#32CD32] hover:bg-[#232323] transition-all duration-200">
                  <FaImage className="h-10 w-10 mb-2" />
                  <span className="text-sm font-semibold">Browse Photo</span>
                  <input
                    type="file"
                    name="images"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg mt-2"
                  />
                )}
                <div className="relative w-full">
                  <FaImage className={iconClass} />
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-[#2A2A2A] text-white mt-2"
                    placeholder="Or paste an image URL (https://...)"
                  />
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-md">
              <FaFileAlt className={iconClass} />
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full max-w-md pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:border-[#32CD32] bg-[#2A2A2A] text-white"
                placeholder="Explain what makes your service unique..."
              />
            </div>

            <div className="relative w-full max-w-md">
              <FaMoneyBill className={iconClass} />
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full max-w-md pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:border-[#32CD32] bg-[#2A2A2A] text-white"
                placeholder="Enter price (Rwf)"
              />
            </div>

            <div className="w-full max-w-md">
              <label className="block text-sm font-medium mb-1">Service Location Type:</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer text-lg">
                  <input
                    type="radio"
                    name="locationType"
                    value="CUSTOM"
                    checked={formData.locationType === 'CUSTOM'}
                    onChange={handleLocationTypeChange}
                    className="w-6 h-6 accent-[#32CD32]" // <-- Larger radio
                    style={{ minWidth: 24, minHeight: 24 }}
                  />
                  <span>
                    Custom Location <span className="text-xs text-gray-400">(client can type their preferred location at booking)</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-lg">
                  <input
                    type="radio"
                    name="locationType"
                    value="PROVIDER"
                    checked={formData.locationType === 'PROVIDER'}
                    onChange={handleLocationTypeChange}
                    className="w-6 h-6 accent-[#32CD32]"
                    style={{ minWidth: 24, minHeight: 24 }}
                  />
                  <span>
                    At My Location <span className="text-xs text-gray-400">(e.g., Home, Hotel, Office, etc.)</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-lg">
                  <input
                    type="radio"
                    name="locationType"
                    value="HYBRID"
                    checked={formData.locationType === 'HYBRID'}
                    onChange={handleLocationTypeChange}
                    className="w-6 h-6 accent-[#32CD32]"
                    style={{ minWidth: 24, minHeight: 24 }}
                  />
                  <span>
                    Hybrid <span className="text-xs text-gray-400">(a flexible option allowing both)</span>
                  </span>
                </label>
              </div>
            </div>

            {(formData.locationType === 'PROVIDER' || formData.locationType === 'HYBRID') && (
              <div className="relative w-full max-w-md">
                <FaMapMarkerAlt className={iconClass} />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full max-w-md pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:border-[#32CD32] bg-[#2A2A2A] text-white"
                  placeholder="Enter your service location (e.g., your business address)"
                />
              </div>
            )}

            <div className="relative w-full max-w-md">
              <FaClock className={iconClass} />
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                className="w-full max-w-md pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:border-[#32CD32] bg-[#2A2A2A] text-white"
                placeholder="Duration in minutes (e.g., 90 for 1h 30min)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-md py-3 bg-[#32CD32] text-black rounded-md font-semibold hover:bg-white hover:text-[#32CD32] transition-all duration-200"
            >
              {loading ? 'Publishing...' : 'Publish to our clients'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddService;