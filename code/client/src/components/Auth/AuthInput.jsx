import React from 'react';
import { motion } from 'framer-motion';

const AuthInput = ({ id, type, label, placeholder, value, handleInputChange, required = true, className = '' }) => {
  return (
    <div className='py-1 flex flex-col'>
      <label className='text-light font-medium' htmlFor={id}>{label}</label>
      <motion.input 
        whileFocus={{ scale: 1.01 }}
        className={`text-black pl-10 my-2 px-4 py-3 text-md rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${className}`}
        id={id} 
        type={type} 
        placeholder={placeholder} 
        value={value} 
        onChange={(e) => handleInputChange(id, e.target.value)}
        required={required} 
      />
    </div>
  );
};

export default AuthInput;