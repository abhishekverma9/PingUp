import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {FaBolt, FaHome, FaEnvelope, FaUserFriends,FaCompass, FaUserCircle, FaPlus, FaSignOutAlt} from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/AuthContext";
import DarkModeToggle from "./DarkModeToggle";

const Sidebar = () => {
  const navItems = [
    { name: "Feed", icon: <FaHome className="h-5 w-5" />, path: "/" },
    { name: "Messages", icon: <FaEnvelope className="h-5 w-5" />, path: "/messages" },
    { name: "Connections", icon: <FaUserFriends className="h-5 w-5" />, path: "/connections" },
    { name: "Discover", icon: <FaCompass className="h-5 w-5" />, path: "/discover" },
    { name: "Profile", icon: <FaUserCircle className="h-5 w-5" />, path: "/profile" },
    { name: "Notifications", icon: <IoIosNotifications className="h-5 w-5" />, path: "/notifications" },
    { name: "Settings", icon: <IoSettingsSharp className="h-5 w-5" />, path: "/settings", hideOnMobile: true },
  ];
  const navigate = useNavigate()
  const { profileData, logout } = useContext(AuthContext) 
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 w-72 p-5 border-r border-gray-200 dark:border-gray-800 font-sans transition-colors duration-200">
      {/* Logo */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img className="text-2xl font-bold tracking-tight text-gray-800" src={assets.logo} alt="Logo" />
        </div>
        <DarkModeToggle />
      </div>
      {/* Navigation */}
      <nav className="flex-grow">
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.name} className={item.hideOnMobile ? "hidden md:block" : ""}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${isActive
                    ? "bg-blue-100 text-blue-600 font-semibold dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Create Post Button */}
      <div onClick={() => navigate('/create-post')} className="mb-8">
        <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-200">
          <FaPlus className="h-6 w-6" />
          <span>Create Post</span>
        </button>
      </div>

      {/* User Profile Section */}
      <div className="flex items-center justify-between mt-auto pt-5 border-t border-gray-200 dark:border-gray-800">
        <div onClick={() => navigate('/profile')} className="flex items-center gap-3">
          <img
            className="h-10 w-10 rounded-full object-cover"
            src={profileData.profile}
            alt="User avatar"
          />
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{profileData.name}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">@{profileData.username}</p>
          </div>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <FaSignOutAlt className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
