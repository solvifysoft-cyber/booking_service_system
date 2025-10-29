import React, { useState, useEffect } from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaArrowUp
} from "react-icons/fa";

const Footer = () => {
  const [showScroll, setShowScroll] = useState(false);

  // Show button when scrolled down 100px
  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#1A1A1A] text-white pt-10 pb-4 mt-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Branding */}
        <div>
          <h2 className="text-2xl font-bold mb-2">ServiceBooking</h2>
          <div className="h-1 w-12 bg-[#32CD32] mb-3" />
          <p className="text-gray-300 mb-4">
            Book trusted local services easily. Our platform connects you to reliable providers for all your needs.
          </p>
          <div className="flex gap-4">
            <a href="uuu" className="text-[#32CD32] hover:text-white transition"><FaFacebookF size={20} /></a>
            <a href="i" className="text-[#32CD32] hover:text-white transition"><FaTwitter size={20} /></a>
            <a href="i" className="text-[#32CD32] hover:text-white transition"><FaInstagram size={20} /></a>
            <a href="p" className="text-[#32CD32] hover:text-white transition"><FaLinkedinIn size={20} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-bold mb-2">Quick Links</h3>
          <div className="h-1 w-10 bg-[#32CD32] mb-3" />
          <ul className="space-y-2">
            <li><a href="/" className="hover:text-[#32CD32]">Home</a></li>
            <li><a href="/services" className="hover:text-[#32CD32]">Our Services</a></li>
            <li><a href="/providers" className="hover:text-[#32CD32]">Service Providers</a></li>
            <li><a href="/about" className="hover:text-[#32CD32]">About Us</a></li>
            <li><a href="/contact" className="hover:text-[#32CD32]">Contact</a></li>
          </ul>
        </div>

        {/* Customer Tools */}
        <div>
          <h3 className="text-xl font-bold mb-2">Customer Tools</h3>
          <div className="h-1 w-10 bg-[#32CD32] mb-3" />
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-[#32CD32]">My Account</a></li>
            <li><a href="#" className="hover:text-[#32CD32]">Booking History</a></li>
            <li><a href="#" className="hover:text-[#32CD32]">Wishlist</a></li>
            <li><a href="#" className="hover:text-[#32CD32]">Customer Support</a></li>
            <li><a href="#" className="hover:text-[#32CD32]">FAQs</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xl font-bold mb-2">Contact Us</h3>
          <div className="h-1 w-10 bg-[#32CD32] mb-3" />
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-[#32CD32]" />
              <a href="/feedback" className="hover:text-[#32CD32]">Contact Us Directly</a>
            </li>
            <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-[#32CD32]" /> Huye, Rwanda</li>
            <li className="flex items-center gap-2"><FaPhoneAlt className="text-[#32CD32]" /> (+250) 783 775 019</li>
            <li className="flex items-center gap-2"><FaEnvelope className="text-[#32CD32]" />solvifysoft@gmail.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#2e3a4d] mt-8 pt-4 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} ServiceBooking. All Rights Reserved.
      </div>

      {showScroll && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-[#32CD32] text-black p-3 rounded-full shadow-lg hover:bg-white hover:text-[#32CD32] transition focus:outline-none focus:ring-2 focus:ring-[#32CD32]"
          aria-label="Scroll to top"
        >
          <FaArrowUp />
        </button>
      )}
    </footer>
  );
};

export default Footer;
