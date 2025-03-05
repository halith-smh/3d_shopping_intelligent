import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router";
import { Login, Register } from './pages';


const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<Register />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App