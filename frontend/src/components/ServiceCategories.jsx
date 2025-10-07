import React from 'react';

const ServiceCategories = ({ selected, onSelect }) => {
  const categories = ['All', 'Massage', 'Food Delivery'];
  return (
    <nav className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide bg-[#121212] border-y border-gray-800">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          aria-pressed={selected === cat}
          className={`px-4 py-1.5 text-sm font-semibold whitespace-nowrap rounded-full border transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#32CD32] ${
            selected === cat
              ? 'bg-[#32CD32] text-black border-[#32CD32]'
              : 'text-gray-300 border-gray-700 hover:bg-gray-800 hover:border-gray-500'
          }`}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
};

export default ServiceCategories;