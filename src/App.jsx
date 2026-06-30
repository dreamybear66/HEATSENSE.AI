import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar    from './components/Navbar';
import Home         from './pages/Home';
import Intelligence from './pages/Intelligence';
import Strategy     from './pages/Strategy';
import Logistics    from './pages/Logistics';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path="/"             element={<Home/>}/>
        <Route path="/intelligence" element={<Intelligence/>}/>
        <Route path="/strategy"     element={<Strategy/>}/>
        <Route path="/logistics"    element={<Logistics/>}/>
      </Routes>
    </BrowserRouter>
  );
}
