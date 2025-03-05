import React from 'react'

const AuthButton = ({text, isDisabled}) => {
  return (
    <button type="submit" disabled={isDisabled} className='bg-primary my-2 w-full rounded-md text-white font-semibold text-lg p-2 disabled:opacity-60'>{text}</button>
  )
}

export default AuthButton