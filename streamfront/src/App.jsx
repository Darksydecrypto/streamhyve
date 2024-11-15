import { useState, useEffect } from "react";
import axios from "axios";
import logo from "../public/logo.png";
import { Routes, Route } from "react-router-dom";
// import "./App.css";
import StreamPage from "./pages/streamPage.jsx";
import Home from "./pages/Home.jsx";

function App() {
	return (
		<div className="min-h-screen w-full bg-gray-900 text-[#FEBD00] font-bold m-0 p-0">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
				<div className="mt-8 text-center">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/stream" element={<StreamPage />} />
					</Routes>
				</div>
			</div>
		</div>
	);
}

export default App;
