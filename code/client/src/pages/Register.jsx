import React, { useEffect, useState } from 'react'
import { AuthButton, AuthInput, BgImage, AuthHeader, AuthFooter } from '../components'
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


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
      const response = await axiosInstance.post("/api/v1/auth/sign-up", user);
      // console.log(response);
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
  }


  return (
    <>
      {!isToken && <BgImage>
        <div className="h-screen flex justify-center items-center">
          <div className="bg-white w-full m-8 p-6 md:w-[450px] rounded-xl">
            <AuthHeader title="Sign Up" p="Already have an account?" span="Log In" to="/login" />
            <form onSubmit={handleFormSubmit}>
              <AuthInput id="name" type="text" label="Name" placeholder="Enter your name" value={user.name} handleInputChange={handleInputChange} />
              <AuthInput id="email" type="email" label="Email" placeholder="Enter your email" value={user.email} handleInputChange={handleInputChange} />
              <AuthInput id="password" type="password" label="Password" placeholder="Enter your password" value={user.password} handleInputChange={handleInputChange} />
              <AuthFooter />
              <AuthButton isDisabled={isDisabled} setDisabled={setDisabled} text="Sign Up" />
            </form>
          </div>
        </div>
      </BgImage>}
    </>
  )
}

export default Register