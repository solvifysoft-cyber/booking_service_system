import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaMoneyBill, FaImage, FaFileAlt } from 'react-icons/fa';

const CATEGORIES = [
  'Breakfast',
  'Hot Drinks',
  'Lunch',
  'Dinner',
  'Snacks',
  'Other'
];

const FoodDeliveryAdd = ({ email }) => {
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [foodDescription, setFoodDescription] = useState('');
  const [foodImage, setFoodImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUserEmail(data?.email || '');
        setUserId(data?.userId || '');
      });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !name || !price || !userId) {
      Swal.fire('Missing Fields', 'Please fill all fields.', 'warning');
      return;
    }
    setLoading(true);

    let imageFilename = foodImage;
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      try {
        const res = await fetch('http://localhost:3000/api/v1/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const result = await res.json();
        imageFilename = result.filename;
      } catch (err) {
        Swal.fire('Error', 'Image upload failed.', 'error');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('http://localhost:3000/api/v1/food-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category,
          name,
          price: Number(price),
          ingredients,
          foodDescription,
          foodImage: imageFilename,
          userId: Number(userId)
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add food item');
      Swal.fire('Success', 'Food item added!', 'success').then(() => {
        navigate('/food-delivery-view');
      });
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to add food item', 'error');
    }
    setLoading(false);
  };

  const iconLabelClass = "flex items-center gap-2 font-semibold text-[#32CD32] mb-1";

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <Navbar isLoggedIn={true} phone={userEmail || email} userName={(userEmail || email)?.split('@')[0]} serviceCategory={localStorage.getItem('userServiceCategory') || ''} />
      <div className="max-w-xl mx-auto mt-10 p-4 w-full">
        <div className="bg-[#1A1A1A] rounded-xl p-8 shadow-lg border border-[#232323]">
          <h2 className="text-2xl font-bold text-[#32CD32] mb-6 flex items-center gap-2">
            <FaUtensils /> Add Food Delivery Item
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
            {/* Food Category */}
            <div className="relative w-full max-w-md">
              <label className={iconLabelClass}>
                <FaUtensils className="text-lg" />
                Food Category
              </label>
              <select
                className="w-full pl-3 pr-3 py-2 rounded bg-[#232323] border border-[#32CD32] text-white focus:outline-none"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="">-- Select Category --</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {/* Food Name */}
            <div className="relative w-full max-w-md">
              <label className={iconLabelClass}>
                <FaUtensils className="text-lg" />
                Food Name
              </label>
              <input
                type="text"
                className="w-full pl-3 pr-3 py-2 rounded bg-[#232323] border border-[#32CD32] text-white focus:outline-none"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Spanish Omelette"
                required
              />
            </div>
            {/* Price */}
            <div className="relative w-full max-w-md">
              <label className={iconLabelClass}>
                <FaMoneyBill className="text-lg" />
                Price (Rwf)
              </label>
              <input
                type="number"
                className="w-full pl-3 pr-3 py-2 rounded bg-[#232323] border border-[#32CD32] text-white focus:outline-none"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 2000"
                min="0"
                required
              />
            </div>
            {/* Ingredients */}
            <div className="relative w-full max-w-md">
              <label className={iconLabelClass}>
                <FaUtensils className="text-lg" />
                Ingredients
              </label>
              <input
                type="text"
                className="w-full pl-3 pr-3 py-2 rounded bg-[#232323] border border-[#32CD32] text-white focus:outline-none"
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                placeholder="e.g. Eggs, Potatoes, Onion"
              />
            </div>
            {/* Food Description */}
            <div className="relative w-full max-w-md">
              <label className={iconLabelClass}>
                <FaFileAlt className="text-lg" />
                Food Description
              </label>
              <textarea
                className="w-full pl-3 pr-3 py-2 rounded bg-[#232323] border border-[#32CD32] text-white focus:outline-none"
                value={foodDescription}
                onChange={e => setFoodDescription(e.target.value)}
                placeholder="Describe your food item"
                rows={3}
              />
            </div>
            {/* Food Image Upload */}
            <div className="relative w-full max-w-md flex flex-col items-center">
              <label className={iconLabelClass}>
                <FaImage className="text-lg" />
                Food Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mb-2"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg mt-2"
                />
              )}
              <input
                type="text"
                className="w-full pl-3 pr-3 py-2 rounded bg-[#232323] border border-[#32CD32] text-white focus:outline-none mt-2"
                value={foodImage}
                onChange={e => setFoodImage(e.target.value)}
                placeholder="Or paste image URL"
              />
            </div>
            <button
              type="submit"
              className="w-full max-w-md py-3 bg-[#32CD32] text-black rounded-md font-semibold text-lg hover:bg-white hover:text-[#32CD32] transition-all duration-200"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Food Item'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FoodDeliveryAdd;