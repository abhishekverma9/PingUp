import React, { useState } from "react";
import { FaArrowRight, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { assets } from "../assets/assets";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const { setToken, api } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        const { data } = await api.post('/api/user/login', { email, password })
        if (data.success) {
          setToken(data.accessToken)
          navigate("/")
          setEmail("")
          setPassword("")
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await api.post('/api/user/register', { name, email, password })
        if (data.success) {
          setToken(data.accessToken)
          navigate("/")
          setName("")
          setEmail("")
          setPassword("")
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.message)
    }
  };
  const handleGoogleSuccess = async (credentialResponse) => {
    try { 
      const { data } = await api.post('/api/user/google-login', {
        idToken: credentialResponse.credential,
      });
      if (data.success) {
        setToken(data.accessToken);
        toast.success("Logged in with Google!");
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Google authentication failed.");
    }
  };
  return (
    <div className="min-h-screen w-[100vw] bg-gradient-to-br from-cyan-100 via-pink-100 to-amber-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans text-gray-800 dark:text-gray-100 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 sm:items-center">

        {/* Left Section */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left p-2 sm:p-8 md:space-y-6 animate-fadeInLeft">
          <img src={assets.logo} className="w-[100px] sm:w-[250px] lg:w-[400px]" alt="Logo" />
          <h1 className="text-xl sm:text-2xl md:text-4xl max-w-md font-extrabold leading-tight text-gray-900 dark:text-gray-100">
            More than just friends <span className="text-blue-600 dark:text-blue-400">truly connect</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-900 dark:text-gray-300 max-w-md">
            Connect with a global community on PingUp. Share, discover, and grow together.
          </p>
        </div>

        {/* Right Section: Auth Form */}
        <div className="w-full max-w-md mx-auto animate-fadeInRight">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200 dark:shadow-none p-6 sm:p-8 md:p-12 transition-colors duration-200">
            <div className="text-left mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold">
                {mode === "login" ? "Sign in to " : "Create account on "}
                <span className="text-blue-600 dark:text-blue-400">PingUp</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                {mode === "login"
                  ? "Welcome back! Please sign in to continue"
                  : "Join us today! Please fill in the details to sign up"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Show Name field only in Signup */}
              {mode === "signup" && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input onChange={(e) => setName(e.target.value)} value={name} type="text" id="name" placeholder="Enter your full name" className="w-full px-2 py-2 sm:py-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 dark:text-white 
                  focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm sm:text-base" required />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" id="email" placeholder="Enter your email"
                  className="w-full px-2 py-2 sm:py-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 dark:text-white 
                             focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm sm:text-base"
                  required />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input onChange={(e) => setPassword(e.target.value)} value={password}
                    type={showPassword ? "text" : "password"} id="password" name="password" placeholder="Enter your password"
                    className="w-full px-2 py-2 sm:py-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 dark:text-white 
                               focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm sm:text-base pr-10"
                    required />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 px-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {mode === "login" && (
                  <div className="text-right mt-2">
                    <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gray-800 dark:bg-blue-600 text-white py-2.5 sm:py-3 rounded-xl flex items-center justify-center font-semibold 
                           hover:bg-gray-900 dark:hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md text-sm sm:text-base"
              >
                {mode === "login" ? "Continue" : "Sign Up"}
                <FaArrowRight className="w-4 h-4 ml-2" />
              </button>
            </form>

            <div className="my-2 text-gray-400 text-sm"></div> 
            {/* Render the clean, official Google button */}
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google Sign-In Failed')}useOneTap  />
            {/* Toggle Login/Signup */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {mode === "login" ? (
                  <>
                    Don’t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
