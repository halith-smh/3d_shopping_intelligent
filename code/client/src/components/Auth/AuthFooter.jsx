import React from 'react'

const AuthFooter = () => {
  return (
    <div className='my-2'>
        <input required type="checkbox" /> <span className='text-light'>I accept the <span className='text-primary underline underline-offset-2'>Terms & conditions</span></span>
    </div>
  )
}

export default AuthFooter