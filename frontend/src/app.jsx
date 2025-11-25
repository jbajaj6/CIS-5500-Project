// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar.jsx";
import HomePage from "./pages/HomePage.jsx";
import TopDisease from "./pages/TopDisease.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/top-disease" element={<TopDisease />} />
      </Routes>
    </BrowserRouter>
  );
}
