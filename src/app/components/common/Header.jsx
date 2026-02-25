import React, { useState, useEffect } from "react";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // { name, profileUrl }

  const checkAuthStatus = React.useCallback(async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserProfile(data.user ? { name: data.user.name, profileUrl: data.user.profileUrl } : null);
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUserProfile(null);
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
      if (!event.detail.isAuthenticated) setUserProfile(null);
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
      {/* Top Section - mobile: logo left, title centered in rest; desktop: unchanged */}
      <div className="bg-white flex flex-row items-center justify-between px-4 py-4 relative min-h-[80px] md:min-h-[120px]">
        <div className="z-10 flex-shrink-0">
          <img src="/logor.png" alt="CPCT Logo" className="h-10 w-auto object-contain md:w-50 md:ml-35 md:h-auto" />
        </div>

        <div className="flex-1 md:flex-none md:absolute inset-0 flex flex-col justify-center items-center text-center px-4 md:ml-0 min-w-0">
          <h1
            className="text-4xl md:text-7xl font-extrabold uppercase md:mt-0 leading-[1.2] text-transparent bg-clip-text bg-center bg-cover"
            style={{
              backgroundImage: "url('/bg.jpg')",
            }}
          >
            MPCPCT
          </h1>
          <p className="text-[11px] sm:text-sm md:text-2xl lg:text-3xl text-gray-600 font-semibold">
            <span className="hidden md:inline"></span>
            To Help in typing & computer proficiency
            <span className="hidden md:inline"></span>
          </p>
        </div>

        <div className="z-10 text-right text-sm hidden md:block"></div>
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
        <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-5 relative">
          <ul className="flex flex-nowrap justify-start items-center space-x-1 md:space-x-4 lg:space-x-8 xl:space-x-12">
            <li className="hover:bg-blue-700 px-2 md:px-3 py-1 rounded ml-0 md:ml-10 md:justify-start">
              <a href="/" className="text-xs md:text-sm lg:text-base">Home</a>
            </li>
            <li className="relative">
              <button
                onClick={() => toggleDropdown("course")}
                className="hover:bg-blue-700 px-2 md:px-3 py-1 rounded flex items-center gap-1 text-xs md:text-sm lg:text-base"
              >
                Course
                <span
                  className={`transform transition-transform duration-300 ${
                    openDropdown === "course" ? "rotate-180" : "rotate-0"
                  } text-xs md:text-sm lg:text-base`}
                >
                  ▾
                </span>
              </button>
              <ul
                className={`absolute left-0 top-full mt-2 bg-white text-black rounded shadow-md min-w-[140px] md:min-w-[160px] lg:min-w-[180px] z-50 transition-all duration-300 origin-top ${
                  openDropdown === "course" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/learning" className="text-xs md:text-sm lg:text-base">Learning</a>
                </li>
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/skill_test" className="text-xs md:text-sm lg:text-base">Skill Test</a>
                </li>
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/exam" className="text-xs md:text-sm lg:text-base">Exam Mode</a>
                </li>
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/topicwise" className="text-xs md:text-sm lg:text-base">Topic Wise MCQ</a>
                </li>
              </ul>
            </li>
            <li className="relative">
              <button
                onClick={() => toggleDropdown("download")}
                className="hover:bg-blue-700 px-2 md:px-3 py-1 rounded flex items-center gap-1 text-xs md:text-sm lg:text-base"
              >
                Download
                <span
                  className={`transform transition-transform duration-300 ${
                    openDropdown === "download" ? "rotate-180" : "rotate-0"
                  } text-xs md:text-sm lg:text-base`}
                >
                  ▾
                </span>
              </button>
              <ul
                className={`absolute left-0 top-full mt-2 bg-white text-black rounded shadow-md min-w-[140px] md:min-w-[160px] lg:min-w-[180px] z-50 transition-all duration-300 origin-top ${
                  openDropdown === "download" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/notes?type=video_notes" className="text-xs md:text-sm lg:text-base">Video Notes</a>
                </li>
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/notes?type=pdf_notes" className="text-xs md:text-sm lg:text-base">Pdf Notes</a>
                </li>
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/notes?type=syllabus_pdf" className="text-xs md:text-sm lg:text-base">Syllabus PDF</a>
                </li>
              </ul>
            </li>
            <li className="relative">
              <button
                onClick={() => toggleDropdown("ourApp")}
                className="hover:bg-blue-700 px-2 md:px-3 py-1 rounded flex items-center gap-1 text-xs md:text-sm lg:text-base"
              >
                Our App
                <span
                  className={`transform transition-transform duration-300 ${
                    openDropdown === "ourApp" ? "rotate-180" : "rotate-0"
                  } text-xs md:text-sm lg:text-base`}
                >
                  ▾
                </span>
              </button>
              <ul
                className={`absolute left-0 top-full mt-2 bg-white text-black rounded shadow-md min-w-[140px] md:min-w-[160px] lg:min-w-[180px] z-50 transition-all duration-300 origin-top ${
                  openDropdown === "ourApp" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/android" className="text-xs md:text-sm lg:text-base">Android App</a>
                </li>
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/android" className="text-xs md:text-sm lg:text-base">iOS App</a>
                </li>
                <li className="px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-200 cursor-pointer">
                  <a href="/android" className="text-xs md:text-sm lg:text-base">App Features</a>
                </li>
              </ul>
            </li>
            <li className="hover:bg-blue-700 px-2 md:px-3 py-1 rounded">
              <a href="/about-us" className="text-xs md:text-sm lg:text-base">About us</a>
            </li>
            <li className="hover:bg-blue-700 px-2 md:px-3 py-1 rounded">
              <a href="/payment-app" className="text-xs md:text-sm lg:text-base">Payment</a>
            </li>
            <li className="hover:bg-blue-700 px-2 md:px-3 py-1 rounded">
              <a href="/contact-us" className="text-xs md:text-sm lg:text-base">Contact Us</a>
            </li>
            <li className="hover:bg-blue-700 px-2 md:px-3 py-1 rounded">
              <a href="/faq" className="text-xs md:text-sm lg:text-base">FAQ</a>
            </li>
          </ul>
          <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 ml-2 md:ml-4">
            {isAuthenticated ? (
              <>
                <a href="/profile" className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors" title="Profile">
                  {userProfile?.profileUrl ? (
                    <img src={userProfile.profileUrl} alt={userProfile?.name || "Profile"} className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full border-2 border-white object-cover" />
                  ) : (
                    <FaUserCircle className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                  )}
                  {userProfile?.name && (
                    <span className="hidden sm:inline text-xs md:text-sm lg:text-base font-medium truncate max-w-[100px] lg:max-w-[120px]">{userProfile.name}</span>
                  )}
                </a>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-2 md:px-3 py-1 rounded hover:bg-red-600 transition-colors text-xs md:text-sm lg:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="bg-white text-black px-2 md:px-3 py-1 rounded hover:bg-gray-100 transition-colors text-xs md:text-sm lg:text-base">Login</a>
                <a href="/signup" className="bg-blue-500 text-white px-2 md:px-3 py-1 rounded hover:bg-blue-600 transition-colors text-xs md:text-sm lg:text-base">Signup</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: backdrop - click outside to close */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Navigation */}
      <div
        className={`fixed top-0 right-0 h-full w-[80%] max-w-[320px] bg-[#290c52] text-white z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          mobileNavOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end p-3">
          <button onClick={toggleMobileNav} className="p-1 text-red-500 hover:text-red-400" aria-label="Close menu">
            <FaTimes size={24} />
          </button>
        </div>
        <a
          href={isAuthenticated ? "/profile" : "/login"}
          onClick={() => setMobileNavOpen(false)}
          className="flex flex-col items-center pb-3 no-underline text-white hover:opacity-90"
        >
          {isAuthenticated && (userProfile?.profileUrl) ? (
            <img
              src={userProfile.profileUrl}
              alt={userProfile?.name || "User"}
              className="w-16 h-16 rounded-full border-2 border-white mb-2 object-cover"
            />
          ) : (
            <img
              src="/user.jpg"
              alt="User"
              className="w-16 h-16 rounded-full border-2 border-white mb-2 object-cover"
            />
          )}
          <p className="text-sm font-semibold">{isAuthenticated && (userProfile?.name) ? userProfile.name : "User"}</p>
        </a>
        <ul className="mt-3 space-y-1 px-3">
          <li className="border-b border-white/20 py-2"><a href="/" onClick={() => setMobileNavOpen(false)} className="text-sm">HOME</a></li>
          <li>
            <button
              onClick={() => toggleDropdown("mobileCourse")}
              className="w-full border-b border-white/20 py-2 text-left flex justify-between items-center text-sm"
            >
              <span>COURSE</span> <span className="text-2xl">▾</span>
            </button>
            {openDropdown === "mobileCourse" && (
              <ul className="pl-3 space-y-1 pt-1.5 pb-1.5 text-sm text-gray-300">
                <li><a href="/learning" onClick={() => setMobileNavOpen(false)}>Learning</a></li>
                <li><a href="/skill_test" onClick={() => setMobileNavOpen(false)}>Skill Test</a></li>
                <li><a href="/exam" onClick={() => setMobileNavOpen(false)}>Exam Mode</a></li>
                <li><a href="/topicwise" onClick={() => setMobileNavOpen(false)}>Topic Wise MCQ</a></li>
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => toggleDropdown("mobileDownload")}
              className="w-full border-b border-white/20 py-2 text-left flex justify-between items-center text-sm"
            >
              <span>DOWNLOAD</span> <span className="text-2xl">▾</span>
            </button>
            {openDropdown === "mobileDownload" && (
              <ul className="pl-3 space-y-1 pt-1.5 pb-1.5 text-sm text-gray-300">
                <li><a href="/notes?type=video_notes" onClick={() => setMobileNavOpen(false)}>Video Notes</a></li>
                <li><a href="/notes?type=pdf_notes" onClick={() => setMobileNavOpen(false)}>Pdf Notes</a></li>
                <li><a href="/notes?type=syllabus_pdf" onClick={() => setMobileNavOpen(false)}>Syllabus PDF</a></li>
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => toggleDropdown("mobileOurApp")}
              className="w-full border-b border-white/20 py-2 text-left flex justify-between items-center text-sm"
            >
              <span>OUR APP</span> <span className="text-2xl">▾</span>
            </button>
            {openDropdown === "mobileOurApp" && (
              <ul className="pl-3 space-y-1 pt-1.5 pb-1.5 text-sm text-gray-300">
                <li><a href="android" onClick={() => setMobileNavOpen(false)}>Android App</a></li>
                <li><a href="android" onClick={() => setMobileNavOpen(false)}>iOS App</a></li>
                <li><a href="android" onClick={() => setMobileNavOpen(false)}>App Features</a></li>
              </ul>
            )}
          </li>
          <li className="border-b border-white/20 py-2"><a href="/about-us" onClick={() => setMobileNavOpen(false)} className="text-sm">ABOUT US</a></li>
          <li className="border-b border-white/20 py-2"><a href="/payment-app" onClick={() => setMobileNavOpen(false)} className="text-sm">PAYMENT</a></li>
          <li className="border-b border-white/20 py-2"><a href="/contact-us" onClick={() => setMobileNavOpen(false)} className="text-sm">CONTACT US</a></li>
          <li className="border-b border-white/20 py-2"><a href="/faq" onClick={() => setMobileNavOpen(false)} className="text-sm">FAQ</a></li>
        </ul>

        <div className="flex justify-center items-center mt-4 px-3 space-x-2 py-3">
          {isAuthenticated ? (
            <>
              <a href="/profile" className="text-white hover:text-blue-300 transition-colors" title="Profile">
                <FaUserCircle size={28} />
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="bg-white text-black px-4 py-2 rounded hover:bg-gray-100 transition-colors text-sm">Login</a>
              <a href="/signup" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm">Signup</a>
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