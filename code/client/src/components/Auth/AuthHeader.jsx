import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthHeader = ({ title, p, span, to }) => {
  return (
    <div className='text-center'>
      <motion.h1 
        className='font-bold text-3xl text-secondary mb-1'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h1>
      <motion.p 
        className='text-light py-3'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {p} <Link className='text-primary hover:underline underline-offset-2 font-medium' to={to}>{span}</Link>
      </motion.p>
    </div>
  );
};

export default AuthHeader;