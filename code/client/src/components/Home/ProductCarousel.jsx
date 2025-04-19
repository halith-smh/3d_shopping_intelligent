import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import ProductPopup from './ProductPopup'; // Import the fixed component

const ProductCarousel = ({ products, onClose }) => {
  if (!products || products.length === 0) return null;

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const handleViewProduct = (product, e) => {
    e.stopPropagation(); // Prevent event bubbling
    setSelectedProduct(product);
  };

  const closeDetailView = () => {
    setSelectedProduct(null);
  };

  // Prevent scrolling when popup is open
  React.useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedProduct]);

  return (
    <>
      {/* Main carousel component */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/15 backdrop-blur-lg px-3 py-2 overflow-hidden relative"
      >
        <div className="flex items-center justify-between mb-1 max-w-3xl mx-auto">
          <h2 className="text-[#682f11] font-medium text-sm">.</h2>
          <button
            onClick={onClose}
            className="text-white bg-black/30 hover:bg-black/50 p-1 rounded-full transition-all"
            aria-label="Close carousel"
          >
            <IoClose size={16} />
          </button>
        </div>

        <div className="flex gap-3 pb-1 overflow-x-auto max-w-3xl mx-auto scrollbar-hide">
          {products.map((product, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -3 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="flex-shrink-0 w-32 sm:w-36 bg-white rounded-lg overflow-hidden shadow-md cursor-pointer transform transition-all duration-300"
            >
              <div className="relative pb-[75%] bg-gray-100 overflow-hidden">
                <img
                  src={product.img || placeholderImage}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 hover:scale-110 p-2.5 rounded-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderImage;
                  }}
                  loading="lazy"
                />
                {hoveredIndex === index && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button
                      className="bg-white text-black font-medium rounded-full px-3 py-1 text-xs"
                      onClick={(e) => handleViewProduct(product, e)}
                      aria-label={`View ${product.name}`}
                    >
                      View
                    </button>
                  </div>
                )}
                {product.discount > 0 && (
                  <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                    -{product.discount}%
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="text-xs font-semibold text-gray-800 truncate">{product.name}</h3>
                <div className="flex flex-col mt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-green-700">{formatPrice(product.price)}</span>
                    {product.mrp > product.price && (
                      <span className="text-xs text-gray-500 line-through">{formatPrice(product.mrp)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-0.5 flex-wrap">
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${getStockColor(product.stock)}`}>
                      {product.stock > 0 ? `${product.stock} in Stock` : 'Out of Stock'}
                    </span>
                    {product.warranty && (
                      <span className="text-[9px] text-gray-500 whitespace-nowrap">{product.warranty}Y Warranty</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Product popup rendered at the root level with improved outside click detection */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductPopup 
            product={selectedProduct}
            isOpen={!!selectedProduct}
            onClose={closeDetailView}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCarousel;