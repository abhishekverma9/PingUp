import React from "react";
import { useContext } from "react";
import { FaBell, FaUserPlus } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// --- Sponsored Widget ---
const SponsoredWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 my-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
      <FaBell className="text-blue-500" /> Sponsored
    </h3>
    <div className="rounded-lg overflow-hidden mb-4">
      <img
        src="https://images.unsplash.com/photo-1558655146-364adaf1fcc9?q=80&w=2070&auto=format&fit=crop"
        alt="Email marketing"
        className="w-full h-auto object-cover"
      />
    </div>
    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Email marketing</h4>
    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
      Supercharge your marketing with a powerful, easy-to-use platform built for results.
    </p>
  </div>
);

// --- Suggested Widget ---
const SuggestedWidget = ({ suggestions }) => {
  const navigate = useNavigate()
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 my-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Suggested for you</h3>
      <ul className="space-y-4">
        {suggestions.map((user) => (
          <li onClick={() =>navigate(`/friendprofile/${user._id}`)} key={user._id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user.profile}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="cursor-pointer">
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{user.name}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">@{user.username}</p>
              </div>
            </div>
            <button className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full hover:opacity-90 shadow-sm shadow-purple-200 dark:shadow-none transition-all">
              <FaUserPlus className="w-3 h-3" /> Follow
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
};

// --- Right Sidebar ---
const RightSidebar = () => {
  const { discoverPeople } = useContext(AuthContext)
  return (
    <div className="font-sans hidden lg:block h-screen overflow-y-scroll w-full max-w-sm mx-auto">
      <SponsoredWidget />
      <SuggestedWidget suggestions={discoverPeople} />
    </div>
  )
};

export default RightSidebar;
