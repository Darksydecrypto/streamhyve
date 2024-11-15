import React from "react";
import logo from "../../public/logo.png";
import { Link } from "react-router-dom";
const Home = () => {
	return (
		<div className="min-h-screen w-full bg-gray-900 text-[#FEBD00] font-bold m-0 p-0">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
				<div className="mt-8 text-center">
					{/* Increased logo sizes */}
					<Link to="/stream">
						<img
							src={logo}
							className="w-48 sm:w-56 md:w-64 lg:w-72 mx-auto"
							alt="Bee logo"
						/>
					</Link>
					<h1 className="title text-3xl sm:text-4xl md:text-5xl font-bold mt-4">
						Stream Hyve
					</h1>
				</div>
			</div>
		</div>
	);
};

export default Home;
