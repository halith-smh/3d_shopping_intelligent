import React from 'react'

const AuthInput = ({id, type, label,placeholder, value, required=true}) => {
  return (
    <div className='py-1 flex flex-col'>
        <label className='text-light' htmlFor={id}>{label}</label>
        <input className='text-black pl-2 my-2 px-4 py-2 text-md rounded-md border border-light focus:outline-light' id={id} type={type} placeholder={placeholder} value={value} required={required} />
    </div>
  )
}

export default AuthInput