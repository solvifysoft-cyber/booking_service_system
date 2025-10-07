import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import logo from '../assets/LOGO-SERVICE.png';
import Footer from './Footer';

const getPriceWithFee = (price) => {
  let p = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
  if (isNaN(p)) p = 0;
  return Math.round(p * 1.15);
};

const BookServicePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [category, setCategory] = useState('service'); // 'service' or 'food'
  const [foodCategories, setFoodCategories] = useState([]);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState('All'); // Default to 'All'

  useEffect(() => {
    // Detect if this is a food delivery provider (from location.state or param)
    if (location.state && location.state.category === 'Food Delivery') {
      setCategory('food');
    } else {
      setCategory('service');
    }
  }, [location.state]);

  useEffect(() => {
    if (category === 'food') {
      // Fetch food delivery items for this provider
      const fetchFood = async () => {
        const [usersRes, foodRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/user', { credentials: 'include' }),
          fetch('http://localhost:3000/api/v1/food-delivery', { credentials: 'include' }),
        ]);
        const users = await usersRes.json();
        const allFoods = await foodRes.json();
        const providerUser = users.find((u) => String(u.id) === String(id));
        setProvider(providerUser);
        const foods = allFoods.filter((f) => String(f.userId) === String(id));
        setFoodItems(foods);

        // Extract unique categories for filter
        const cats = Array.from(new Set(foods.map(f => f.category).filter(Boolean)));
        setFoodCategories(['All', ...cats]);
        setSelectedFoodCategory('All');
      };
      fetchFood();
    } else {
      // Fetch provider and their services
      const fetchData = async () => {
        const [usersRes, servicesRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/user', { credentials: 'include' }),
          fetch('http://localhost:3000/api/v1/servises', { credentials: 'include' }),
        ]);
        const users = await usersRes.json();
        const allServices = await servicesRes.json();
        const providerUser = users.find((u) => String(u.id) === String(id));
        setProvider(providerUser);
        setServices(allServices.filter((s) => String(s.userId) === String(id)));
      };
      fetchData();
    }
  }, [id, category]);

  const toggleService = (service) => {
    setSelected((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleBook = () => {
    if (selected.length === 0) return;
    navigate('/payment', {
      state: {
        selectedServices: selected,
        category: category === 'food' ? 'Food Delivery' : 'Service'
      }
    });
  };

  if (!provider) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <section className="bg-[#1A1A1A] sticky top-0 z-50 text-[#32CD32] px-2 py-3 shadow-md">
        <div className="flex items-center justify-between mb-3 max-w-3xl mx-auto w-full">
          <div className="flex items-center">
            <img
              src={logo}
              alt="Service Logo"
              className="w-24 h-24 object-contain cursor-pointer"
              onClick={() => navigate('/')}
            />
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
<div className="text-center py-2 px-4 bg-[#232323] rounded-md shadow-md mt-2 max-w-2xl mx-auto">
  <p className="text-xl sm:text-2xl font-bold text-[#32CD32] flex items-center justify-center animate-pulse gap-2">
    🚚 We deliver in <span className="underline underline-offset-2">20 minutes</span>!
  </p>
  {selected.length > 0 && (
    <p className="mt-1 text-gray-400 text-sm">
      You’ve selected <span className="text-white font-semibold">{selected.length}</span> item{selected.length > 1 ? 's' : ''}.
    </p>
  )}
</div>

      </section>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-1 py-4 sm:px-2 sm:py-6">
        <div className="bg-[#1A1A1A] rounded-xl p-2 sm:p-8 w-full max-w-3xl mx-auto shadow-lg border border-[#232323]">
          <h2 className="text-center text-2xl font-bold mb-4 text-[#32CD32]">
            Book from <b>{provider.businessName || provider.name}</b>
          </h2>
          {category === 'food' ? (
            <>
              {/* Food Category Filter */}
              <div className="flex gap-2 mb-6 flex-wrap justify-center">
                {foodCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFoodCategory(cat)}
                    className={`px-4 py-1 rounded-full font-semibold border transition ${
                      selectedFoodCategory === cat
                        ? 'bg-[#32CD32] text-black border-[#32CD32]'
                        : 'text-gray-300 border-gray-700 hover:bg-[#32CD32] hover:text-black hover:border-[#32CD32]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Food Items Grouped by Category */}
              <div>
                {(selectedFoodCategory === 'All'
                  ? foodCategories.filter(cat => cat !== 'All')
                  : [selectedFoodCategory]
                ).map(cat => (
                  <div key={cat} className="mb-6 border border-gray-400 rounded-lg p-2 sm:p-4 bg-[#181818]">
                    <div className="font-bold text-lg mb-2" style={{ color: '#32CD32' }}>
                      {cat}
                    </div>
                    <div>
                      {foodItems
                        .filter(f => f.category === cat)
                        .map(food => (
                          <div
                            key={food.id}
                            className="flex items-center justify-between py-3 border-b border-[#333] last:border-b-0 relative"
                          >
                            {/* Food Image */}
                            <img
                              src={
                                food.foodImage
                                  ? (food.foodImage.startsWith('http')
                                    ? food.foodImage
                                    : `http://localhost:3000/uploads/${food.foodImage}`)
                                  : undefined
                              }
                              alt={food.name}
                              className="w-12 h-12 sm:w-20 sm:h-20 rounded-full object-cover mr-2"
                              style={{ background: '#232323' }}
                            />
                            {/* Info section */}
                            <div className="flex-1 flex flex-col items-start justify-center min-w-0">
                              <span className="font-semibold text-base sm:text-lg text-white truncate">{food.name}</span>
                              {food.ingredients && (
                                <span className="text-gray-400 text-xs sm:text-sm mt-1 truncate">{food.ingredients}</span>
                              )}
                              <div className="flex flex-row items-center gap-2 mt-1">
                                <span className="text-[#32CD32] font-bold text-base sm:text-lg">{food.price} Rwf</span>
                              </div>
                            </div>
                            {/* Take button: bottom-right on mobile, right side on desktop */}
                            <button
                              className={`font-semibold px-3 py-1 rounded ${
                                selected.includes(food)
                                  ? 'bg-[#32CD32] text-black'
                                  : 'bg-[#232323] text-[#32CD32] border border-[#32CD32] hover:bg-[#32CD32] hover:text-black'
                              } sm:static sm:ml-2 absolute right-2 bottom-2`}
                              onClick={() => toggleService(food)}
                              type="button"
                              style={{
                                minWidth: 60,
                                marginLeft: '8px',
                                position: 'absolute',
                                right: '8px',
                                bottom: '8px',
                                // On desktop, keep inline; on mobile, move to bottom-right
                                transform: 'translateY(0)',
                              }}
                            >
                              {selected.includes(food) ? (
                                <span className="text-lg">&#10003;</span>
                              ) : (
                                <span className="text-base">Take</span>
                              )}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4 mb-8">
              {services.map((s, idx) => (
                <div
                  key={idx}
                  className={`flex items-center border rounded-lg px-2 py-2 transition relative ${
                    selected.includes(s)
                      ? 'border-[#32CD32] bg-[#232323]'
                      : 'border-[#2a2a2a] bg-[#1A1A1A]'
                  }`}
                  style={{ minHeight: 60 }}
                >
                  <img
                    src={Array.isArray(s.images) ? s.images[0] : s.images}
                    alt={s.name}
                    className="w-10 h-10 rounded-full object-cover mr-2"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">{s.name}</div>
                    <div className="text-xs text-gray-400">
                      {/* Only show price with percentage for massage */}
                      <span className="text-[#32CD32] font-bold">
                        {getPriceWithFee(s.price).toLocaleString()} Rwf
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{s.description}</div>
                  </div>
                  <button
                    className={`ml-2 font-semibold focus:outline-none text-xs px-3 py-1 rounded ${
                      selected.includes(s)
                        ? 'bg-[#32CD32] text-black hover:bg-white hover:text-[#32CD32]'
                        : 'bg-[#232323] text-[#32CD32] border border-[#32CD32] hover:bg-[#32CD32] hover:text-black'
                    } transition`}
                    onClick={() => toggleService(s)}
                    type="button"
                    style={{ minWidth: 60 }}
                  >
                    {selected.includes(s) ? (
                      <span className="text-lg">&#10003;</span>
                    ) : (
                      <span className="text-base">Take</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            className="block mx-auto bg-[#32CD32] text-white py-3 px-6 rounded font-bold text-lg hover:bg-white hover:text-[#32CD32] transition w-full sm:w-auto mt-4"
            onClick={handleBook}
            disabled={selected.length === 0}
            style={{ opacity: selected.length === 0 ? 0.6 : 1 }}
          >
            {selected.length === 0 ? 'Select at least one item' : `Get your services`}
          </button>
          <p className="text-center text-sm text-gray-400 mt-2">
  Enjoy fast delivery, fresh meals & reliable services in just 20 minutes!
</p>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookServicePage;
