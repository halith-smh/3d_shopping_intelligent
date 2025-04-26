import React, { useEffect, useState } from 'react';
import { AuthButton, AuthInput, BgImage, AuthHeader, AuthFooter } from '../components';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import { RiUserAddLine } from 'react-icons/ri';
import { containerVariants, itemVariants, SIGN_UP_URI } from '../utils/constants';

const Register = () => {
  const nav = useNavigate();
  const [isToken, setToken] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      nav('/');
    } else {
      setToken(false);
    }
  }, []);

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [isDisabled, setDisabled] = useState(false);

  const handleInputChange = (id, value) => {
    setUser({
      ...user,
      [id]: value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setDisabled(true);

    const loader = toast.loading('Loading...');
    try {
      const response = await axiosInstance.post(SIGN_UP_URI, user);
      if (response.status === 201) {
        toast.dismiss(loader);
        toast.success(response.data.message);
        setUser({
          name: "",
          email: "",
          password: ""
        });
        setDisabled(false);
        nav('/login');
      }
    } catch (error) {
      toast.dismiss(loader);
      if (error?.response?.data?.message) toast.error(error?.response?.data?.message);
      else toast.error(error.message);
      setDisabled(false);
    }
  };

  return (
    <>
      {!isToken && (
        <BgImage>
          <div className="h-screen flex justify-center items-center">
            <motion.div 
              className="bg-white w-full m-4 p-4 md:w-[500px] rounded-2xl shadow-xl"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <div className="flex justify-center mb-6">
                  <RiUserAddLine className="text-primary text-6xl" />
                </div>
                <AuthHeader title="Create Account" p="Already have an account?" span="Log In" to="/login" />
              </motion.div>
              
              <form onSubmit={handleFormSubmit}>
                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <FiUser className="absolute top-12 left-3 text-gray-400" />
                    <AuthInput 
                      id="name" 
                      type="text" 
                      label="Name" 
                      placeholder="Enter your name" 
                      value={user.name} 
                      handleInputChange={handleInputChange}
                      className="pl-10" 
                    />
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <FiMail className="absolute top-12 left-3 text-gray-400" />
                    <AuthInput 
                      id="email" 
                      type="email" 
                      label="Email" 
                      placeholder="Enter your email" 
                      value={user.email} 
                      handleInputChange={handleInputChange}
                      className="pl-10" 
                    />
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <FiLock className="absolute top-12 left-3 text-gray-400" />
                    <AuthInput 
                      id="password" 
                      type="password" 
                      label="Password" 
                      placeholder="Enter your password" 
                      value={user.password} 
                      handleInputChange={handleInputChange}
                      className="pl-10" 
                    />
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <AuthFooter />
                </motion.div>
                
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: isDisabled ? 1 : 1.03 }}
                  whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                >
                  <AuthButton 
                    isDisabled={isDisabled} 
                    setDisabled={setDisabled} 
                    text={
                      <div className="flex items-center justify-center gap-2">
                        <FiUserPlus className="text-lg" />
                        <span>Sign Up</span>
                      </div>
                    } 
                  />
                </motion.div>
                
                {/* <motion.div 
                  className="mt-6 text-center"
                  variants={itemVariants}
                >
                  <p className="text-light mb-4">Or sign up with</p>
                  <div className="flex justify-center gap-4">
                    <button type="button" className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                      <img src="/api/placeholder/24/24" alt="Google" className="w-6 h-6" />
                    </button>
                    <button type="button" className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                      <img src="/api/placeholder/24/24" alt="Facebook" className="w-6 h-6" />
                    </button>
                    <button type="button" className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                      <img src="/api/placeholder/24/24" alt="Apple" className="w-6 h-6" />
                    </button>
                  </div>
                </motion.div> */}
              </form>
            </motion.div>
          </div>
        </BgImage>
      )}
    </>
  );
};

export default Register;