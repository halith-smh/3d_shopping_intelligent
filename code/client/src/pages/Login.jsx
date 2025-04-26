import React, { useEffect, useState } from 'react';
import { AuthButton, AuthInput, BgImage, AuthHeader, AuthFooter } from '../components';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { RiLoginCircleLine } from 'react-icons/ri';
import { containerVariants, itemVariants, SIGN_IN_URI } from '../utils/constants';
import text from '../lang/text';
import { useLanguage } from '../utils/languageContext';

const Login = () => {
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

    const SignInloader = toast.loading('Loading...');
    try {
      const response = await axiosInstance.post(SIGN_IN_URI, user);
      if (response.status === 200) {
        toast.dismiss(SignInloader);
        toast.success(response.data.message);
        setUser({
          email: "",
          password: ""
        });
        setDisabled(false);
        localStorage.setItem('token', response.data.data.token);
        nav('/');
      }
    } catch (error) {
      setDisabled(false);
      toast.dismiss(SignInloader);
      if (error?.response?.data?.message) toast.error(error?.response?.data?.message);
      else toast.error(error.message);
    }
  }

  const {language} = useLanguage();
  return (
    <>
      {!isToken && (
        <BgImage>
          <div className="h-screen flex justify-center items-center">
            <motion.div 
              className="bg-white w-full m-4 p-4 md:w-[520px] rounded-2xl shadow-xl"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <div className="flex justify-center mb-6">
                  <RiLoginCircleLine className="text-primary text-6xl" />
                </div>
                <AuthHeader title={text[language].welcome_back} p={text[language].no_account} span={text[language].sign_up} to="/sign-up" />
              </motion.div>
              
              <form onSubmit={handleFormSubmit}>
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
                
                {/* <motion.div variants={itemVariants}>
                  <div className="flex justify-between items-center mb-4">
                    <AuthFooter />
                    <a href="#" className="text-primary text-sm font-medium hover:underline">Forgot Password?</a>
                  </div>
                </motion.div> */}
                
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
                        <FiLogIn className="text-lg" />
                        <span>{text[language].login}</span>
                      </div>
                    } 
                  />
                </motion.div>
                
              </form>
            </motion.div>
          </div>
        </BgImage>
      )}
    </>
  );
};

export default Login;