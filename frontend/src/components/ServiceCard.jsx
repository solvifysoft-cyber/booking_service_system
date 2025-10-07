import React from 'react';
import { useNavigate } from 'react-router-dom';

const StarRating = ({ rating = 2 }) => {
  const totalStars = 5;
  return (
    <div className="flex items-center gap-0.5 ml-auto">
      {[...Array(totalStars)].map((_, i) => (
        <span
          key={i}
          className={i < rating ? 'text-[#FFA500] text-[12px] sm:text-xs md:text-sm' : 'text-gray-400 text-[12px] sm:text-xs md:text-sm'}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ServiceCard = ({
  service,
  allServices = [],
  providerServices,
  availability,
  small = true,
}) => {
  const navigate = useNavigate();
  const user = service.user || {};
  const rating = service.rating || user.rating || 2;
  const isFood = service.category === 'Food delivery';

  // Format working days and hours for display
  let workingDays = '';
  let workingHours = '';
  if (availability) {
    if (availability.dayFrom && availability.dayTo) {
      workingDays = `${availability.dayFrom.toLowerCase()} - ${availability.dayTo.toLowerCase()}`;
    }
    if (availability.hourFrom && availability.hourTo) {
      const formatHour = (h) => {
        const [hour, min] = h.split(':');
        const hNum = parseInt(hour, 10);
        const ampm = hNum >= 12 ? 'PM' : 'AM';
        const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
        return `${h12}:${min}${ampm}`;
      };
      workingHours = `${formatHour(availability.hourFrom)}-${formatHour(availability.hourTo)}`;
    }
  }

  const handleBookMe = () => {
    if (isFood) {
      navigate('/book-service/' + (service.userId || service.id), {
        state: {
          provider: user,
          category: 'Food Delivery'
        }
      });
    } else {
      const providerList =
        providerServices ||
        allServices.filter((s) => s.userId === service.userId);
      navigate(`/book-service/${service.userId || service.id}`, {
        state: {
          provider: user,
          services: providerList,
        },
      });
    }
  };

  return (
    <div
      className={`
        bg-[#1A1A1A] rounded-lg shadow border border-[#232323] flex flex-col
        p-3 sm:p-4 md:p-5
        h-[260px] sm:h-[280px] md:h-[340px] lg:h-[380px]
        max-w-[98vw] xs:max-w-[240px] sm:max-w-[210px] md:max-w-[260px] lg:max-w-[300px]
        min-w-0 mx-auto
        text-[12px] sm:text-[13px] md:text-[15px] lg:text-base
        transition-all
      `}
      style={{
        fontSize: undefined,
        margin: '4px',
      }}
    >
      {/* Top: User info */}
      <div className="flex items-center mb-1 w-full min-h-[26px] sm:min-h-[28px] md:min-h-[34px]">
        <img
          src={user.profileImage || '/default-user-icon.png'}
          alt={user.username ? `${user.username} profile` : 'User'}
          className="w-7 h-7 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full border border-[#32CD32] object-cover mr-1"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[0.95em] sm:text-[1em] md:text-[1.1em] text-white leading-tight truncate max-w-[90px] sm:max-w-[90px] md:max-w-[120px]">{user.businessName || 'Unknown'}</div>
          <div className="text-gray-400 text-[0.8em] sm:text-[0.8em] md:text-xs truncate max-w-[90px] sm:max-w-[90px] md:max-w-[120px]">{user.username}</div>
        </div>
        <StarRating rating={rating} />
      </div>
      {/* Food/Service Image */}
      {service.images && (
        <img
          src={
            Array.isArray(service.images)
              ? service.images[0]
              : (service.images.startsWith('http')
                  ? service.images
                  : `http://localhost:3000/uploads/${service.images}`)
          }
          alt={service.name || 'Image'}
          className="w-full h-24 sm:h-24 md:h-32 lg:h-36 object-cover rounded mb-1 bg-[#232323]"
          loading="lazy"
        />
      )}
      {/* Title and Description */}
      <div className="bg-[#232323] rounded-b-lg py-1 px-1 mt-1 min-h-[28px] sm:min-h-[32px] md:min-h-[40px]">
        <div className="font-bold text-[0.95em] sm:text-[1em] md:text-[1.1em] text-white truncate">
          {service.category}, {user.businessName}
        </div>
        <div className="text-gray-300 text-[0.8em] sm:text-[0.8em] md:text-xs mt-1 truncate" style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {service.description}
        </div>
      </div>
      {/* Working Days/Hours */}
      <div className="flex flex-col gap-0 mt-1 text-[0.8em] sm:text-[0.8em] md:text-xs min-h-[18px] sm:min-h-[22px] md:min-h-[28px]">
        {workingDays && (
          <div>
            <span className="font-semibold text-[#32CD32]">Days:</span>
            <span className="ml-1 text-white font-medium">{workingDays}</span>
          </div>
        )}
        {workingHours && (
          <div>
            <span className="font-semibold text-[#32CD32]">Hours:</span>
            <span className="ml-1 text-white font-medium">{workingHours}</span>
          </div>
        )}
      </div>
      {/* Book Button */}
      <div className="flex-grow" />
      <div className="flex justify-end w-full pt-0">
        <button
          onClick={handleBookMe}
          className="bg-[#32CD32] hover:bg-white hover:text-[#32CD32] text-black font-bold py-1 px-4 rounded text-[11px] sm:text-[12px] md:text-sm transition w-[90px] sm:w-[100px] md:w-[110px] h-[28px] sm:h-[32px] md:h-[36px] flex items-center justify-center"
          style={{
            minWidth: 0,
            fontSize: undefined,
            position: 'relative',
            bottom: 0,
          }}
        >
          {isFood ? 'Order Now' : 'Book Now'}
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;