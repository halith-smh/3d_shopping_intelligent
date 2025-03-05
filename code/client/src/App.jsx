import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router";
import { Home, Login, Register } from './pages';
import { Toaster } from 'react-hot-toast';


const App = () => {
  return (
    <BrowserRouter>
    <Toaster/>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<Register />} />

      <Route path='/' element={<Home/>}></Route>

      <Route path="*" element={<h1>Not Found</h1>} />
    </Routes>
    </BrowserRouter>
  )
}

export default App