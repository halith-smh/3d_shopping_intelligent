import React from 'react'
import bgImg from '../assets/images/bg.png'


const BgImage = ({children}) => {
  return (
    <div
      className="h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
        {children}
    </div>
  )
}

export default BgImage