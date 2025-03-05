import React from 'react'
import { AuthButton, AuthInput, BgImage, AuthHeader, AuthFooter } from '../components'

const Login = () => {
  return (
    <BgImage>
      <div className="h-screen flex justify-center items-center">
        <div className="bg-white w-full m-8 p-6 md:w-[450px] rounded-xl">
        <AuthHeader title="Login" p="Don't have an account?" span="Sign Up" to="/sign-up" />
        <form>
          <AuthInput id="email" type="email" label="Email" placeholder="Enter your email" />
          <AuthInput id="password" type="password" label="Password" placeholder="Enter your password" />
          <AuthFooter/>
          <AuthButton text="Log In" />
        </form>
        </div>
      </div>
    </BgImage>
  )
}

export default Login