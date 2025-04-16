import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { motion } from 'framer-motion';

const ProductCarousel = ({ products, onClose }) => {
    if (!products || products.length === 0) return null;
    
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // const formatPrice = (price) => {
    //     return new Intl.NumberFormat('en-US', {
    //         style: 'currency',
    //         currency: 'INR',
    //         maximumFractionDigits: 0
    //     }).format(price / 100);
    // };

    // Local placeholder image for fallback instead of external service
    const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%23888888'%3EProduct Image%3C/text%3E%3C/svg%3E";

    return (
        <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/15 backdrop-blur-lg px-3 py-2 overflow-hidden relative"
        >
            <div className="flex items-center justify-between mb-1 max-w-3xl mx-auto">
                <h2 className="text-[#682f11]  font-medium text-sm">.</h2>
                <button 
                    onClick={onClose}
                    className="text-white bg-black/30 hover:bg-black/50 p-1 rounded-full transition-all"
                >
                    <IoClose size={16} />
                </button>
            </div>
            
            <div className="flex gap-3 pb-1 overflow-x-auto max-w-3xl mx-auto">
                {products.map((product, index) => (
                    <motion.div 
                        key={index}
                        whileHover={{ y: -3 }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="flex-shrink-0 w-28 md:w-32 bg-white rounded-lg overflow-hidden shadow-md cursor-pointer transform transition-all duration-300"
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
                            />
                            {hoveredIndex === index && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <button className="bg-white text-black font-medium rounded-full px-3 py-1 text-xs">
                                        View
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-2">
                            <h3 className="text-xs font-semibold text-gray-800 truncate">{product.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs font-bold text-green-700">{product.price}</span>
                                <span className="text-[10px] bg-green-100 rounded-full px-1.5 py-0.5 text-green-800 font-medium">In Stock</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default ProductCarousel;