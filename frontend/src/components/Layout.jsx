// src/components/Layout.jsx
import React, { useState, useContext } from "react";
import { Outlet, useLocation, matchPath } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaBars, FaTimes } from "react-icons/fa";
import AudioCall from "./AudioCall";
import VideoCall from "./VideoCall";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";

const Layout = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { incomingCall, outgoingCall, setOutgoingCall, setIncomingCall } = useContext(SocketContext);
  const { profileData } = useContext(AuthContext);

  // List of all valid routes in your App
  const validRoutes = [
    '/', '/connections', '/login', '/forgot-password', '/reset-password/:token',
    '/messages', '/profile', '/friendprofile/:friendId', '/discover',
    '/create-post', '/create-story', '/notifications', '/settings', '/post/:postId'
  ];

  // Check if current path matches any valid route
  const isKnownRoute = validRoutes.some(route => matchPath({ path: route, end: true }, location.pathname));

  // Routes where sidebar should be hidden completely
  const hideSidebarRoutes = ["/login","/create-story","/forgot-password"];
  const isHideSidebarRoute = hideSidebarRoutes.includes(location.pathname) || location.pathname.startsWith("/reset-password");

  // Hide if it's a specific route or if it's an unknown route (404)
  const shouldHideSidebar = isHideSidebarRoute || !isKnownRoute;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== Sidebar Section ===== */}
      {!shouldHideSidebar && (
        <>
          {/* Hamburger for mobile */}
          {!location.pathname.startsWith('/messages') && (
            <div className="lg:hidden fixed top-2 right-2 z-50">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-md shadow-md focus:outline-none"
              >
                {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>
          )}

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 border-r border-gray-200 dark:border-gray-800 sticky top-0 h-screen overflow-y-auto overflow-x-hidden">
            <Sidebar />
          </div>

          {/* Mobile Drawer Sidebar */}
          <div
            className={`fixed inset-0 z-40 flex lg:hidden transition-opacity duration-300 ${
              isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
            }`}
          >
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setIsOpen(false)}
            ></div>
            {/* Drawer */}
            <div
              className={`relative z-50 w-72 bg-white dark:bg-gray-900 h-full shadow-lg transition-transform duration-300 transform ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <Sidebar onClose={() => setIsOpen(false)} />
            </div>
          </div>
        </>
      )}

      {/* ===== Main Content Section ===== */}
      <main className="flex-1 w-full overflow-x-hidden overflow-y-auto min-w-0">
        <Outlet />
      </main>

      {/* ===== Global Call Overlays ===== */}
      {/* 
        We check if either outgoingCall or incomingCall exists and is of type 'audio'.
        If yes, we render AudioCall. We determine the otherUserId based on whether we are calling or receiving.
      */}
      {((outgoingCall && outgoingCall.type === "audio") || (incomingCall && incomingCall.type === "audio")) && (
        <AudioCall
          currentUserId={profileData?.userId}
          otherUserId={outgoingCall ? outgoingCall.to : incomingCall.from}
          onClose={() => {
            setOutgoingCall(null);
            setIncomingCall(null);
          }}
        />
      )}

      {/* Video Call (similarly checking for 'video' type) */}
      {((outgoingCall && outgoingCall.type === "video") || (incomingCall && incomingCall.type === "video")) && (
        <VideoCall
          currentUserId={profileData?.userId}
          otherUserId={outgoingCall ? outgoingCall.to : incomingCall.from}
          onClose={() => {
            setOutgoingCall(null);
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
};

export default Layout;
