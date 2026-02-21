"use client";

import { FaGooglePlay, FaApple } from "react-icons/fa";

export default function ComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#290c52] via-purple-700 to-indigo-900 text-white px-6">
      <div className="text-center max-w-lg">
        {/* Logo / App Icon */}
        <div className="flex justify-center mb-6">
          <img
            src="/lo.jpg"
            alt="App Logo"
            className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
          Our App is Coming Soon 🚀
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8">
          We’re working hard to launch our official mobile app.  
          Stay tuned for updates on <span className="font-semibold">Google Play</span> and <span className="font-semibold">App Store</span>.
        </p>

        {/* Store Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-semibold hover:scale-105 transition shadow-lg">
            <FaGooglePlay size={22} /> Coming Soon on Play Store
          </button>
          <button className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-semibold hover:scale-105 transition shadow-lg">
            <FaApple size={22} /> Coming Soon on App Store
          </button>
        </div>

        {/* Newsletter / Notify */}
        <div className="mt-10">
          <form className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full sm:w-72 px-4 py-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="bg-pink-500 px-5 py-3 rounded-xl font-semibold hover:bg-pink-600 transition"
            >
              Notify Me
            </button>
          </form>
          <p className="text-sm mt-3 text-gray-300">
            We’ll notify you when the app is live 📲
          </p>
        </div>
      </div>
    </div>
  );
}
