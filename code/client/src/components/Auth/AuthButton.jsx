import React from 'react';
import { motion } from 'framer-motion';

const AuthButton = ({ text, isDisabled }) => {
  return (
    <motion.button 
      type="submit" 
      disabled={isDisabled} 
      className='bg-primary my-2 w-full rounded-md text-white font-semibold text-lg p-3 disabled:opacity-60 shadow-md hover:shadow-lg transition-shadow'
    >
      {text}
    </motion.button>
  );
};

export default AuthButton;