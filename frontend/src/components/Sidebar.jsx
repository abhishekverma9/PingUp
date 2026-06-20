import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {FaBolt, FaHome, FaEnvelope, FaUserFriends,FaCompass, FaUserCircle, FaPlus, FaSignOutAlt} from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/AuthContext";
import DarkModeToggle from "./DarkModeToggle";

const Sidebar = ({ onClose }) => {
  const navItems = [
    { name: "Feed", icon: <FaHome className="h-5 w-5" />, path: "/" },
    { name: "Messages", icon: <FaEnvelope className="h-5 w-5" />, path: "/messages" },
    { name: "Connections", icon: <FaUserFriends className="h-5 w-5" />, path: "/connections" },
    { name: "Discover", icon: <FaCompass className="h-5 w-5" />, path: "/discover" },
    { name: "Profile", icon: <FaUserCircle className="h-5 w-5" />, path: "/profile" },
    { name: "Notifications", icon: <IoIosNotifications className="h-5 w-5" />, path: "/notifications" },
    { name: "Settings", icon: <IoSettingsSharp className="h-5 w-5" />, path: "/settings" },
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
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md font-semibold"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  }`
                }
              >
                <div className="flex items-center gap-4">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
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
      <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-800">
        <div 
          className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
        >
          <div 
            onClick={() => {
              navigate('/profile');
              if (onClose) onClose();
            }} 
            className="flex items-center gap-3 flex-1"
          >
            <img
              className="h-10 w-10 rounded-full object-cover shadow-sm group-hover:ring-2 group-hover:ring-purple-400 transition-all"
              src={profileData.profile}
              alt="User avatar"
            />
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{profileData.name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">@{profileData.username}</p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }} 
            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Log Out"
          >
            <FaSignOutAlt className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
