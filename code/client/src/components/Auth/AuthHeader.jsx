import React from 'react'
import { Link } from 'react-router-dom'

const AuthHeader = ({title, p, span, to}) => {
  return (
    <div className='text-center'>
        <h1 className='font-bold text-3xl text-secondary'>{title}</h1>
        <p className='text-light py-4'>{p} <Link className='text-primary underline underline-offset-2 text-und font-[600]' to={to}>{span}</Link></p>
    </div>
  )
}

export default AuthHeader