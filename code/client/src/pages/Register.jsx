import React from 'react'
import { AuthButton, AuthInput, BgImage, AuthHeader, AuthFooter } from '../components'


const Register = () => {
  return (
    <BgImage>
      <div className="h-screen flex justify-center items-center">
        <div className="bg-white w-full m-8 p-6 md:w-[450px] rounded-xl">
        <AuthHeader title="Sign Up" p="Already have an account?" span="Log In" to="/login" />
        <form>
          <AuthInput id="name" type="text" label="Name" placeholder="Enter your name" />
          <AuthInput id="email" type="email" label="Email" placeholder="Enter your email" />
          <AuthInput id="password" type="password" label="Password" placeholder="Enter your password" />
          <AuthFooter/>
          <AuthButton text="Sign Up" />
        </form>
        </div>
      </div>
    </BgImage>
  )
}

export default Register