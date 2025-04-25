import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router";
import { Home, Login, Register } from './pages';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './utils/languageContext';


const App = () => {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<Register />} />

          <Route path='/' element={<Home />}></Route>

          <Route path="*" element={<h1 className='text-3xl p-8'>404: Not Found :(</h1>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App