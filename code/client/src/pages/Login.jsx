import React, { useEffect, useState } from 'react'
import { AuthButton, AuthInput, BgImage, AuthHeader, AuthFooter } from '../components'
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

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
      const response = await axiosInstance.post("/api/v1/auth/sign-in", user);
      // console.log(response);
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


  return (
    <>
      {!isToken && <BgImage>
        <div className="h-screen flex justify-center items-center">
          <div className="bg-white w-full m-8 p-6 md:w-[450px] rounded-xl">
            <AuthHeader title="Login" p="Don't have an account?" span="Sign Up" to="/sign-up" />
            <form onSubmit={handleFormSubmit}>
              <AuthInput id="email" type="email" label="Email" placeholder="Enter your email" value={user.email} handleInputChange={handleInputChange} />
              <AuthInput id="password" type="password" label="Password" placeholder="Enter your password" value={user.password} handleInputChange={handleInputChange} />
              <AuthFooter />
              <AuthButton isDisabled={isDisabled} setDisabled={setDisabled} text="Log In" />
            </form>
          </div>
        </div>
      </BgImage>}
    </>
  )
}

export default Login