import React from 'react'

const AuthButton = ({text}) => {
  return (
    <button type="submit" className='bg-primary my-2 w-full rounded-md text-white font-bold text-xl p-2'>{text}</button>
  )
}

export default AuthButton