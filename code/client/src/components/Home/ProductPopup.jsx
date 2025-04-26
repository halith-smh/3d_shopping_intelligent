import React, { useEffect, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import { motion } from 'framer-motion';

const ProductPopup = ({ product, onClose, isOpen }) => {
  if (!product || !isOpen) return null;
  
  const popupRef = useRef(null);
  
  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStockColor = (stock) => {
    if (stock <= 0) return 'bg-red-100 text-red-800';
    if (stock < 10) return 'bg-red-100 text-red-800';
    if (stock < 25) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%23888888'%3EProduct Image%3C/text%3E%3C/svg%3E";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        ref={popupRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.25, opacity: 0 }}
        transition={{ type: 'fade', damping: 45 }}
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-md md:max-w-xl mx-auto overflow-hidden relative"
      >
        {/* Discount badge */}
        {product.discount > 0 && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              -{product.discount}% OFF
            </div>
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 bg-black/80 hover:bg-black text-white p-2 rounded-full transition-all shadow-lg"
          aria-label="Close product details"
        >
          <IoClose size={24} />
        </button>
        
        {/* Product image */}
        <div className="bg-gray-100 h-64 md:h-72 relative">
          <img
            src={product.img || placeholderImage}
            alt={product.name}
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderImage;
            }}
          />
        </div>
        
        {/* Product details */}
        <div className="p-5 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">{product.name}</h2>
          
          {product.description && (
            <p className="text-gray-600 mt-2 mb-4">{product.description}</p>
          )}
          
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xl md:text-2xl font-bold text-green-700">
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-gray-500 line-through text-lg">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>
          
          {/* Product meta */}
          <div className="mt-5 space-y-4">
            {product.category && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Category</h3>
                <p className="text-gray-700">{product.category}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <div className={`px-4 py-1.5 rounded-full text-sm ${getStockColor(product.stock)}`}>
                {product.stock > 0 ? `${product.stock} in Stock` : 'Out of Stock'}
              </div>
              {product.warranty && (
                <div className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm">
                  {product.warranty} Year Warranty
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductPopup;