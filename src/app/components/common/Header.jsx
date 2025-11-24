import React, { useState, useEffect } from "react";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const checkAuthStatus = React.useCallback(async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 5000); // Check every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  // Listen for storage events (when login/logout happens)
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    const handleAuthStateChanged = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, [checkAuthStatus]);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
    setOpenDropdown(null);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsAuthenticated(false);
        // Dispatch custom event to notify other components about logout
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isAuthenticated: false } }));
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="border-b shadow-sm relative z-50">
      {/* Top Section */}
      <div className="bg-white flex items-center justify-between px-4 py-4 relative">
        <div className="z-10 md:block hidden">
          <img src="/logor.png" alt="CPCT Logo" className="w-50 ml-35" />
        </div>

        <div className="md:absolute inset-0 flex flex-col justify-center items-center text-center px-4 md:ml-0 ml-11">
          <h1
            className="text-3xl md:text-7xl font-extrabold uppercase md:mt-0 leading-[1.2] text-transparent bg-clip-text bg-center bg-cover"
            style={{
              backgroundImage: "url('/bg.jpg')",
            }}
          >
            MPCPCT
          </h1>
          <p className="text-[12px] sm:text-sm md:text-2xl lg:text-3xl text-gray-600 font-semibold">
            <span className="hidden md:inline"></span>
            To Help in typing & computer proficiency
            <span className="hidden md:inline"></span>
          </p>
        </div>

        <div className="z-10 text-right text-sm"></div>
      </div>

      {/* Mobile Nav Toggle */}
      <div className="md:hidden bg-[#290c52] flex justify-between items-center px-4 py-2">
        <span className="text-white font-medium"><a href="/">Home </a></span>
        <button onClick={toggleMobileNav} className="text-white focus:outline-none">
          {mobileNavOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-[#290c52] text-white">
        <div className="flex items-center justify-between px-4 py-2 md:py-5 relative">
          <ul className="flex flex-nowrap justify-start items-center space-x-2 md:space-x-12 ">
            <li className="hover:bg-blue-700 px-3 py-1 rounded ml-0 md:ml-10 md:justify-start"><a href="/">Home</a></li>
            <li className="relative">
              <button
                onClick={() => toggleDropdown("course")}
                className="hover:bg-blue-700 px-3 py-1 rounded flex items-center gap-1"
              >
                Course
                <span
                  className={`transform transition-transform duration-300 ${
                    openDropdown === "course" ? "rotate-180" : "rotate-0"
                  } text-lg`}
                >
                  ▾
                </span>
              </button>
              <ul
                className={`absolute left-0 top-full mt-2 bg-white text-black rounded shadow-md min-w-[160px] z-50 transition-all duration-300 origin-top ${
                  openDropdown === "course" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/learning">Learning</a>
                </li>
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/skill_test">Skill Test</a>
                </li>
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/exam">Exam Mode</a>
                </li>
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/topicwise">Topic Wise MCQ</a>
                </li>
              </ul>
            </li>
            <li className="relative">
              <button
                onClick={() => toggleDropdown("download")}
                className="hover:bg-blue-700 px-3 py-1 rounded flex items-center gap-1"
              >
                Download
                <span
                  className={`transform transition-transform duration-300 ${
                    openDropdown === "download" ? "rotate-180" : "rotate-0"
                  } text-lg`}
                >
                  ▾
                </span>
              </button>
              <ul
                className={`absolute left-0 top-full mt-2 bg-white text-black rounded shadow-md min-w-[160px] z-50 transition-all duration-300 origin-top ${
                  openDropdown === "download" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/notes?type=video_notes">Video Notes</a>
                </li>
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/notes?type=pdf_notes">Pdf Notes</a>
                </li>
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/notes?type=syllabus_pdf">Syllabus PDF</a>
                </li>
              </ul>
            </li>
            <li className="relative">
              <button
                onClick={() => toggleDropdown("ourApp")}
                className="hover:bg-blue-700 px-3 py-1 rounded flex items-center gap-1"
              >
                Our App
                <span
                  className={`transform transition-transform duration-300 ${
                    openDropdown === "ourApp" ? "rotate-180" : "rotate-0"
                  } text-lg`}
                >
                  ▾
                </span>
              </button>
              <ul
                className={`absolute left-0 top-full mt-2 bg-white text-black rounded shadow-md min-w-[160px] z-50 transition-all duration-300 origin-top ${
                  openDropdown === "ourApp" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/android">Android App</a>
                </li>
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/android">iOS App</a>
                </li>
                <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/android">App Features</a>
                </li>
              </ul>
            </li>
            <li className="hover:bg-blue-700 px-3 py-1 rounded"><a href="/about-us">About us</a></li>
            <li className="hover:bg-blue-700 px-3 py-1 rounded"><a href="/payment-app">Payment</a></li>
            <li className="hover:bg-blue-700 px-3 py-1 rounded"><a href="/contact-us">Contact Us</a></li>
            <li className="hover:bg-blue-700 px-3 py-1 rounded"><a href="/faq">FAQ</a></li>
          </ul>
          <div className="flex items-center space-x-4 ml-4">
            {isAuthenticated ? (
              <>
                <a href="/profile" className="text-white hover:text-blue-300 transition-colors" title="Profile">
                  <FaUserCircle size={24} />
                </a>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-xs"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="bg-white text-black px-3 py-1 rounded hover:bg-gray-100 transition-colors text-xs">Login</a>
                <a href="/signup" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-xs">Signup</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Navigation */}
      <div
        className={`fixed top-0 right-0 h-full w-[80%] bg-[#290c52] text-white z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          mobileNavOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={toggleMobileNav}>
            <FaTimes size={24} />
          </button>
        </div>
<div className="flex flex-col items-center">
          <img
            src="/user.jpg"
            alt="User"
            className="w-24 h-24 rounded-full border-2 border-white mb-2"
          />
          <p className="text-lg font-semibold">User</p>
        </div>
        <ul className="mt-6 space-y-2 px-4">
          <li className="border-b py-2"><a href="/">HOME</a></li>
          <li>
            <button
              onClick={() => toggleDropdown("mobileCourse")}
              className="w-full border-b pt-5 text-left py-2 flex justify-between items-center"
            >
              <span>COURSE</span> <span className="text-3xl">▾</span>
            </button>
            {openDropdown === "mobileCourse" && (
              <ul className="pl-4 space-y-1 pt-4 text-sm text-gray-300">
                <li><a href="/learning">Learning</a></li>
                <li><a href="/skill_test">Skill Test</a></li>
                <li><a href="/exam">Exam Mode</a></li>
                <li><a href="/topicwise">Topic Wise MCQ</a></li>
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => toggleDropdown("mobileDownload")}
              className="w-full border-b pt-5 text-left py-2 flex justify-between items-center"
            >
              <span>DOWNLOAD</span> <span className="text-3xl">▾</span>
            </button>
            {openDropdown === "mobileDownload" && (
              <ul className="pl-4 space-y-1 pt-4 text-sm text-gray-300">
                <li><a href="/notes?type=video_notes">Video Notes</a></li>
                <li><a href="/notes?type=pdf_notes">Pdf Notes</a></li>
                <li><a href="/notes?type=syllabus_pdf">Syllabus PDF</a></li>
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => toggleDropdown("mobileOurApp")}
              className="w-full border-b pt-5 text-left py-2 flex justify-between items-center"
            >
              <span>OUR APP</span> <span className="text-3xl">▾</span>
            </button>
            {openDropdown === "mobileOurApp" && (
              <ul className="pl-4 space-y-1 pt-4 text-sm text-gray-300">
                <li><a href="android">Android App</a></li>
                <li><a href="android">iOS App</a></li>
                <li><a href="android">App Features</a></li>
              </ul>
            )}
          </li>
          <li className="border-b pt-5 py-2"><a href="/about-us">ABOUT US</a></li>
          <li className="border-b pt-5 py-2"><a href="/payment-app">PAYMENT</a></li>
          <li className="border-b pt-5 py-2"><a href="/contact-us">CONTACT US</a></li>
          <li className="border-b pt-5 py-2"><a href="/faq">FAQ</a></li>
        </ul>

        <div className="flex justify-center items-center mt-10 px-4 space-x-2">
          {isAuthenticated ? (
            <>
              <a href="/profile" className="text-white hover:text-blue-300 transition-colors" title="Profile">
                <FaUserCircle size={28} />
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="bg-white text-black px-4 py-2 rounded hover:bg-gray-100 transition-colors">Login</a>
              <a href="/signup" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">Signup</a>
            </>
          )}
        </div>
      </div>

      {/* Highlight Bar */}
      <div className="bg-pink-200 relative overflow-hidden h-14">
        <div className="absolute left-0 md:left-4  top-1/2 transform -translate-y-1/2 z-10">
          <span className="bg-black text-white text-xs px-2 py-2 rounded">HIGHLIGHTS</span>
        </div>
        <div className="flex items-center whitespace-nowrap text-md font-semibold text-gray-800">
          <div className="w-full md:w-[85%] py-4 mx-auto">
            <span className="w-full md:w-[50%] py-2">
              <marquee behavior="scroll" direction="left">
                • CPCT Scorecard is valid for 07 years from the date of exam <span className="pl-15">• Basic Computer & Typing skill are important for data entry</span> <span className="">\ IT Operator</span> <span className="">\ Assistant Grade 3</span> <span className="">\ Shorthand</span> <span className="">\ Typist</span> and other similar positions in the departments <span className="">\ corporation and agencies under government of India.</span>
              </marquee>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}