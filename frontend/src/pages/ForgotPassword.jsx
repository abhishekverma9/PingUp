import React, { useState, useContext } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Assumes your backend route is POST /api/user/forgot-password
      const { data } = await api.post('/api/user/forgot-password', { email });
      if (data.success) {
        toast.success(data.message || "Password reset link sent to your email!");
        // Navigate back to login or stay here and let them read the toast
        navigate("/login");
      } else {
        toast.error(data.message || "Failed to send reset link.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-[100vw] bg-gradient-to-br from-cyan-100 via-pink-100 to-amber-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans text-gray-800 dark:text-gray-100 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 sm:items-center">

        {/* Left Section */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left p-2 sm:p-8 md:space-y-6 animate-fadeInLeft">
          <img src={assets.logo} className="w-[100px] sm:w-[250px] lg:w-[400px]" alt="Logo" />
          <h1 className="text-xl sm:text-2xl md:text-4xl max-w-md font-extrabold leading-tight text-gray-900 dark:text-gray-100">
            Forgot your <span className="text-blue-600 dark:text-blue-400">password?</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-900 dark:text-gray-300 max-w-md">
            No worries! Enter your email and we'll send you a link to reset it.
          </p>
        </div>

        {/* Right Section: Auth Form */}
        <div className="w-full max-w-md mx-auto animate-fadeInRight">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200 dark:shadow-none p-6 sm:p-8 md:p-12 transition-colors duration-200">
            <div className="text-left mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold">
                Reset Password
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2">
                We will send a reset link to your registered email address.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input 
                  onChange={(e) => setEmail(e.target.value)} 
                  value={email} 
                  type="email" 
                  id="email" 
                  placeholder="Enter your email"
                  className="w-full px-2 py-2 sm:py-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm sm:text-base"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 dark:bg-blue-600 text-white py-2.5 sm:py-3 rounded-xl flex items-center justify-center font-semibold hover:bg-gray-900 dark:hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
                <FaArrowRight className="w-4 h-4 ml-2" />
              </button>
            </form>

            <div className="mt-6 sm:mt-8 text-center">
              <Link to="/login" className="flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base">
                <FaArrowLeft className="w-3 h-3 mr-2" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
