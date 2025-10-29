import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Navbar from './Navbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const FoodDeliveryView = ({ email }) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editFood, setEditFood] = useState(null);
  const [editForm, setEditForm] = useState({
    foodImage: '',
    imageFile: null,
    category: '',
    name: '',
    price: '',
    ingredients: '',
    foodDescription: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const navigate = useNavigate();

  // Fetch user info (get userId and email)
  useEffect(() => {
    fetch('http://localhost:3000/api/v1/login/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUserEmail(data?.email || '');
        setUserId(data?.userId || '');
      });
  }, []);

  // Fetch food delivery items for this user only (by userId)
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch('http://localhost:3000/api/v1/food-delivery', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        // Filter foods by userId (owner only)
        let filtered = Array.isArray(data) ? data : [];
        filtered = filtered.filter(item => String(item.userId) === String(userId));
        setFoods(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  // Open edit modal with food data
  const openEditModal = (food) => {
    setEditFood(food);
    setEditForm({
      foodImage: food.foodImage || '',
      imageFile: null,
      category: food.category || '',
      name: food.name || '',
      price: food.price || '',
      ingredients: food.ingredients || '',
      foodDescription: food.foodDescription || '',
    });
    setImagePreview(
      food.foodImage
        ? food.foodImage.startsWith('http')
          ? food.foodImage
          : `http://localhost:3000/uploads/${food.foodImage}`
        : ''
    );
    setEditModal(true);
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm({ ...editForm, imageFile: file, foodImage: '' });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditCancel = () => {
    setEditModal(false);
    setEditFood(null);
    setImagePreview('');
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    let imageValue = editForm.foodImage;
    if (editForm.imageFile) {
      const data = new FormData();
      data.append('file', editForm.imageFile);
      try {
        const res = await fetch('http://localhost:3000/api/v1/upload', {
          method: 'POST',
          body: data,
        });
        if (!res.ok) throw new Error('Upload failed');
        const result = await res.json();
        imageValue = result.filename;
      } catch {
        Swal.fire('Error', 'Image upload failed.', 'error');
        return;
      }
    }
    try {
      const updateFields = {
        foodImage: imageValue,
        category: editForm.category,
        name: editForm.name,
        price: Number(editForm.price),
        ingredients: editForm.ingredients,
        foodDescription: editForm.foodDescription,
      };
      const res = await fetch(`http://localhost:3000/api/v1/food-delivery/${editFood.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateFields),
        credentials: 'include',
      });
      if (res.ok) {
        const updated = await res.json();
        setFoods(foods.map(f => f.id === editFood.id ? updated : f));
        setEditModal(false);
        Swal.fire('Success', 'Food item updated.', 'success');
      } else {
        let msg = 'Failed to update food item.';
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

  const handleDelete = (food) => {
    Swal.fire({
      title: 'Delete Food Item?',
      text: `Are you sure you want to delete "${food.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#e53e3e',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:3000/api/v1/food-delivery/${food.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const data = await res.json();
            Swal.fire('Error', data.message || 'Failed to delete food item', 'error');
            return;
          }
          Swal.fire('Deleted', 'Food item deleted.', 'success');
          setFoods(foods => foods.filter(f => f.id !== food.id));
        } catch {
          Swal.fire('Error', 'Failed to delete food item', 'error');
        }
      }
    });
  };

  // Group foods by category
  const grouped = foods.reduce((acc, food) => {
    if (!acc[food.category]) acc[food.category] = [];
    acc[food.category].push(food);
    return acc;
  }, {});

  const floatingBtnStyle = {
    position: 'fixed',
    top: '50%',
    right: '32px',
    transform: 'translateY(-50%)',
    zIndex: 1000,
    background: '#32CD32',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    boxShadow: '0 4px 16px rgba(50,205,50,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    cursor: 'pointer',
    transition: 'background 0.2s'
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <Navbar isLoggedIn={true} phone={userEmail || email} userName={(userEmail || email)?.split('@')[0]} serviceCategory={localStorage.getItem('userServiceCategory') || ''} />
      <div className="max-w-2xl mx-auto mt-6 p-2 sm:p-4 w-full">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-2xl font-bold text-white text-center">Your Food Delivery Menu</h2>
        </div>
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center text-gray-400">No food items found.</div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-4 sm:mb-6">
              <div className="font-bold text-lg text-[#32CD32] mb-2">{cat}</div>
              <div className="bg-[#232323] border border-[#32CD32] rounded-lg p-2 sm:p-4">
                {items.map(food => (
                  <div
                    key={food.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 border-b border-[#333] last:border-b-0 gap-2"
                  >
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-[#32CD32] text-lg">●</span>
                      {food.foodImage && (
                        <img
                          src={
                            food.foodImage.startsWith('http')
                              ? food.foodImage
                              : `http://localhost:3000/uploads/${food.foodImage}`
                          }
                          alt={food.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                      <div className="flex flex-col ml-2 min-w-0">
                        <span className="font-semibold text-base sm:text-lg text-white truncate">{food.name}</span>
                        {food.ingredients && (
                          <span className="text-gray-400 text-xs sm:text-sm truncate">{food.ingredients}</span>
                        )}
                        <span className="text-[#32CD32] font-bold text-base sm:text-lg mt-1">{food.price} Rwf</span>
                      </div>
                    </div>
                    <div className="flex flex-row items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                      <button
                        className="text-[#32CD32] hover:text-white text-xl"
                        title="Edit"
                        onClick={() => openEditModal(food)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-500 hover:text-white text-xl"
                        title="Delete"
                        onClick={() => handleDelete(food)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Floating "+" button */}
      <button
        style={{
          ...floatingBtnStyle,
          right: '16px',
          width: '48px',
          height: '48px',
          fontSize: '1.5rem'
        }}
        aria-label="Add Food Delivery"
        title="Add Food Delivery"
        onClick={() => navigate('/food-delivery')}
      >
        <FaPlus />
      </button>
      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <form
            onSubmit={handleEditSave}
            className="bg-[#1A1A1A] text-white rounded-xl w-full max-w-2xl p-4 sm:p-8 flex flex-col items-center relative border border-[#32CD32] shadow-lg"
            style={{
              minWidth: 280,
              maxWidth: 700,
              width: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(50,205,50,0.25)'
            }}
          >
            <button
              type="button"
              onClick={handleEditCancel}
              className="absolute right-4 top-4 text-gray-400 hover:text-white text-xl"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 w-full text-left text-[#32CD32] flex items-center gap-2">
              <FaEdit /> Edit Food Item
            </h2>
            {/* Image Upload */}
            <div className="w-full mb-4">
              <label className="block text-sm font-medium mb-1 text-[#32CD32]">Food Image</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="border border-[#32CD32] rounded px-2 py-1"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded border-2 border-[#32CD32]"
                  />
                )}
              </div>
              <input
                type="text"
                name="foodImage"
                value={editForm.foodImage}
                onChange={handleEditFormChange}
                className="w-full mt-2 px-3 py-2 border border-[#32CD32] rounded bg-[#232323] text-white"
                placeholder="Or paste image URL"
              />
            </div>
            <div className="flex flex-wrap w-full gap-4">
              <div className="flex-1 min-w-[120px]">
                <label className="text-sm mb-1 w-full text-left block text-[#32CD32]">Category</label>
                <input
                  type="text"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditFormChange}
                  className="w-full mb-3 px-3 py-2 border border-[#32CD32] rounded bg-[#232323] text-white"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-sm mb-1 w-full text-left block text-[#32CD32]">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="w-full mb-3 px-3 py-2 border border-[#32CD32] rounded bg-[#232323] text-white"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-sm mb-1 w-full text-left block text-[#32CD32]">Price (Rwf)</label>
                <input
                  type="number"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditFormChange}
                  className="w-full mb-3 px-3 py-2 border border-[#32CD32] rounded bg-[#232323] text-white"
                  min="0"
                />
              </div>
            </div>
            <div className="w-full mb-4">
              <label className="text-sm mb-1 w-full text-left block text-[#32CD32]">Ingredients</label>
              <input
                type="text"
                name="ingredients"
                value={editForm.ingredients}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 border border-[#32CD32] rounded bg-[#232323] text-white"
                placeholder="e.g. Eggs, Potatoes, Onion"
              />
            </div>
            <div className="w-full mb-4">
              <label className="text-sm mb-1 w-full text-left block text-[#32CD32]">Food Description</label>
              <textarea
                name="foodDescription"
                rows="3"
                value={editForm.foodDescription}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 border border-[#32CD32] rounded bg-[#232323] text-white"
                placeholder="Describe your food item"
              />
            </div>
            <button
              type="submit"
              className="mt-4 bg-[#32CD32] hover:bg-white hover:text-[#32CD32] px-6 py-2 rounded font-semibold transition text-black w-full"
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

export default FoodDeliveryView;