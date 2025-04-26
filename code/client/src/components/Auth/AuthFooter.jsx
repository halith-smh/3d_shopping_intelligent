import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const AuthFooter = ({ language, text }) => {
  return (
    <div className='my-3 flex items-center'>
      <motion.input
        whileTap={{ scale: 1.2 }}
        required
        type="checkbox"
        className="w-4 h-4 accent-primary mr-2"
      />
      <span className='text-light'>
        {text[language].accept_terms} <motion.span
          className='text-primary font-medium hover:underline underline-offset-2 cursor-pointer'
          whileHover={{ scale: 1.05 }}
        >
          <Link to="/terms-and-conditions">{text[language].terms_conditions}</Link>
        </motion.span>
      </span>
    </div>
  );
};

export default AuthFooter;