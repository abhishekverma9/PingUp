import React, { useState, useContext } from "react";
import { FaArrowRight, FaEye, FaEyeSlash } from "react-icons/fa";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();
  const { token } = useParams(); // Extracts the token from the URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    
    setLoading(true);
    try {
      // Assumes your backend route is PATCH /api/user/reset-password/:token
      const { data } = await api.patch(`/api/user/reset-password/${token}`, { password: newPassword });
      if (data.success) {
        toast.success(data.message || "Password reset successfully!");
        navigate("/login");
      } else {
        toast.error(data.message || "Failed to reset password. Link might be expired.");
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
            Create new <span className="text-blue-600 dark:text-blue-400">password</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-900 dark:text-gray-300 max-w-md">
            Please enter your new password below. Make sure it's something you'll remember!
          </p>
        </div>

        {/* Right Section: Auth Form */}
        <div className="w-full max-w-md mx-auto animate-fadeInRight">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200 dark:shadow-none p-6 sm:p-8 md:p-12 transition-colors duration-200">
            <div className="text-left mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold">
                Set New Password
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    value={newPassword} 
                    type={showPassword ? "text" : "password"} 
                    id="newPassword" 
                    placeholder="Enter new password"
                    className="w-full px-2 py-2 sm:py-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm sm:text-base pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 px-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    value={confirmPassword} 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword" 
                    placeholder="Confirm new password"
                    className="w-full px-2 py-2 sm:py-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm sm:text-base pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 px-2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 dark:bg-blue-600 text-white py-2.5 sm:py-3 rounded-xl flex items-center justify-center font-semibold hover:bg-gray-900 dark:hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
                <FaArrowRight className="w-4 h-4 ml-2" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
