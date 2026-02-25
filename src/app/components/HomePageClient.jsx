"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const items = [
  { label: "Learning", img: "/lp.jpg" },
  { label: "Skill Test", img: "/skill.webp" },
  { label: "Exam Mode", img: "/exam.jpg" },
];

const App = () => {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/profile");
        setIsAuthenticated(response.ok);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    const handleAuthStateChanged = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated);
    };

    window.addEventListener("authStateChanged", handleAuthStateChanged);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthStateChanged);
    };
  }, []);

  const validateMobile = (value) => {
    if (!value) return "Mobile number is required";
    if (value.length !== 10) return "Enter a valid 10-digit mobile number";

    for (let i = 0; i < value.length; i++) {
      const char = value.charAt(i);
      if (char < "0" || char > "9") {
        return "Enter a valid 10-digit mobile number";
      }
    }
    return "";
  };

  const handleMobileChange = (e) => {
    const val = e.target.value;
    setMobile(val);
    setError(validateMobile(val));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error && e.target.value) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const mobileError = validateMobile(mobile);
    if (mobileError) {
      setError(mobileError);
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobile, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid credentials. Please try again.");
        setIsLoading(false);
      } else {
        window.dispatchEvent(
          new CustomEvent("authStateChanged", {
            detail: { isAuthenticated: true },
          })
        );
        router.push("/profile");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
      setIsLoading(false);
    }
  };

  const backgroundImageStyle = { backgroundImage: "url('/b.jpg')" };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={backgroundImageStyle}
    >
      <div className="min-h-screen bg-opacity-60">
        <div className="p-4">
          <header className="text-center md:text-left ml-0 md:ml-37 md:justify-center mt-4 md:mt-10">
            <h1 className="text-2xl md:text-5xl font-bold">
              Empower Your Future with MPCPCT
            </h1>
            <p className="text-sm md:text-lg ml-0 md:ml-28 md:justify-center mt-2 md:mt-4">
              Learn typing and computer skills interactively to prepare for
              government roles
            </p>
          </header>

          <div className="flex flex-col lg:flex-row justify-between gap-4 md:gap-6 relative">
            <nav className="flex justify-center ml-0 md:ml-28 md:justify-start mt-10 md:mt-20 animate-fadeInUp gap-4 md:gap-8 lg:gap-x-8 lg:gap-y-6 w-full" aria-label="Main navigation">
              {items.map(({ label, img }) => {
                let colorClass = "bg-red-600";
                if (label === "Learning") colorClass = "bg-green-800";
                else if (label === "Skill Test") colorClass = "bg-blue-900";
                else if (label === "Exam Mode") colorClass = "bg-red-800";

                const card = (
                  <article
                    key={label}
                    className="w-full sm:w-72 h-auto md:h-64 rounded-xl overflow-hidden shadow-md border-4 md:border-8 border-[#290c52] bg-white cursor-pointer transform transition-transform duration-300 hover:scale-105"
                  >
                    <div className="h-20 w-full md:h-48 md:w-full">
                      <img
                        src={img}
                        alt={`${label} icon - MPCPCT ${label} feature`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div
                      className={
                        colorClass +
                        " text-white text-center py-1 md:py-4 text-[10px] md:text-lg font-semibold md:font-bold"
                      }
                    >
                      {label}
                    </div>
                  </article>
                );

                if (label === "Learning")
                  return (
                    <a href="/learning" key={label} className="flex-1 min-w-0 sm:flex-initial" aria-label={`Go to MPCPCT ${label} page`}>
                      {card}
                    </a>
                  );
                if (label === "Skill Test")
                  return (
                    <a href="/skill_test" key={label} className="flex-1 min-w-0 sm:flex-initial" aria-label={`Go to MPCPCT ${label} page`}>
                      {card}
                    </a>
                  );
                if (label === "Exam Mode")
                  return (
                    <a href="/exam" key={label} className="flex-1 min-w-0 sm:flex-initial" aria-label={`Go to MPCPCT ${label} page`}>
                      {card}
                    </a>
                  );

                return <div key={label}>{card}</div>;
              })}
            </nav>

            {/* RIGHT SIDE LOGIN / LOGGED IN BOX */}
            <aside className={`w-full lg:w-48 border border-[#290c52] bg-gray-50 shadow-md p-4 rounded animate-fadeInUp flex flex-col items-center justify-start ${isAuthenticated ? "py-4 relative lg:absolute lg:right-[-15px] lg:top-0 h-auto lg:mt-[-147px] self-start" : "space-y-4 py-4 md:py-20 relative lg:absolute lg:right-[-15px] lg:top-0 h-auto md:h-[620px] lg:mt-[-147px]"}`}>
              {isAuthenticated ? (
                <div className="text-center">
                  <div className="text-green-700 text-xl font-semibold">
                    You are logged in
                  </div>
                  <a
                    href="/profile"
                    className="mt-4 block mx-auto bg-red-600 text-white py-2 px-4 rounded hover:scale-105 transition-transform text-center"
                    aria-label="Go to MPCPCT profile"
                  >
                    Go to Profile
                  </a>
                </div>
              ) : (
                <>
                  <span className="text-pink-300 font-semibold text-[20px] border-l border-[#290c52] bg-[#290c52] pt-4 md:pt-7 pb-0 md:pb-6 text-center w-full lg:w-48 absolute right-0 lg:right-[-16px] z-10 top-[155px] rounded-tl-lg rounded-tr-lg md:rounded-none lg:top-[-148px]">
                    Welcome Back
                  </span>

                  <div className="w-full lg:w-48 border border-[#290c52] bg-gray-50 shadow-md p-4 space-y-4 py-10 md:py-20 relative lg:absolute lg:right-[-15px] lg:top-0 h-auto md:h-[620px] rounded animate-fadeInUp lg:mt-[-147px]">
                    <h2 className="font-semibold text-pink-300 text-xl text-center">
                      <span className="font-normal text-black text-sm md:text-[14px] block md:inline md:ml-2">
                        Login to your MPCPCT Account
                      </span>
                    </h2>

                    <form onSubmit={handleSubmit}>
                      <input
                        type="text"
                        placeholder="Mob. No."
                        value={mobile}
                        onChange={handleMobileChange}
                        className={`${
                          error
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-red-400"
                        } w-full border px-2 py-1 mt-3 md:mt-2 rounded focus:outline-none focus:ring-2`}
                        aria-label="Mobile number"
                      />

                      <div className="relative w-full mt-3 md:mt-5">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={handlePasswordChange}
                          className={`${
                            error
                              ? "border-red-500 focus:ring-red-400"
                              : "border-gray-300 focus:ring-red-400"
                          } w-full border px-2 py-1 rounded focus:outline-none focus:ring-2 pr-10`}
                          aria-label="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                          tabIndex={-1}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      {error && (
                        <p className="text-red-600 text-sm mt-1" role="alert">{error}</p>
                      )}

                      <a
                        href="/forgot-password"
                        className="block text-sm text-red-600 hover:underline mt-2"
                        aria-label="Forgot password"
                      >
                        Forgot Password?
                      </a>

                      <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-2 cursor-pointer rounded transition-transform duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-3 md:mt-5"
                        disabled={
                          !!error ||
                          mobile.length === 0 ||
                          password.length === 0 ||
                          isLoading
                        }
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin h-5 w-5 mr-2 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Logging in...
                          </span>
                        ) : (
                          "Login"
                        )}
                      </button>
                    </form>

                    <div className="border-t pt-2 mt-3 md:mt-5">
                      <div className="text-gray-700 mt-3 md:mt-5 text-center">
                        NEW USER
                      </div>
                      <button className="w-full mt-2 md:mt-3 bg-pink-200 text-red-700 font-semibold py-2 cursor-pointer rounded transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                        <a
                          href={isAuthenticated ? "/profile" : "/signup"}
                          className="block"
                          aria-label="Register for MPCPCT account"
                        >
                          {isAuthenticated ? "Go to Profile" : "Register Now!"}
                        </a>
                      </button>
                    </div>

                    <div className="mt-auto">
                      <Image
                        src="/mpc.png"
                        alt="MPCPCT Logo"
                        width={80}
                        height={80}
                        className="w-16 h-16 md:w-20 md:h-20 mx-auto"
                      />
                      <p className="text-center text-xs md:text-[13px] text-gray-600 mt-1">
                        MPCPCT - Empowering Education
                      </p>
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>

          <section className="mt-18 md:mt-35 w-full bg-pink-100 bg-opacity-70 text-black p-4 rounded shadow text-sm">
            <div className="text-center">
              <h2 className="text-2xl md:text-5xl pt-3 md:pt-5 font-semibold">
                Welcome to our website<br />
                <span className="text-[#290c52] text-4xl">MPCPCT.COM</span>
              </h2>
            </div>
            <div className="text-center">
              <p className="text-base md:text-xl mt-3 md:mt-6">
                <strong>MPCPCT</strong> is a user-friendly learning website that helps you learn,
                practice, and improve your typing speed and accuracy. <strong>MPCPCT</strong> offers comprehensive
                preparation for CPCT, RSCIT, and CCC exams with bilingual support in Hindi and English.
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm md:text-lg mt-2 md:mt-4 md:pl-50">
                <span className="font-semibold">Tip:</span>{" "}
                <span className="font-semibold text-red-600">
                  For taking a typing test on a mobile phone, connect your
                  mobile to a keyboard with an OTG cable.
                </span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default App;

