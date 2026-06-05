// src/components/Layout.jsx
import React, { useState } from "react";
import { Outlet, useLocation, matchPath } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaBars, FaTimes } from "react-icons/fa";

const Layout = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="flex min-h-screen">
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
          <div className="hidden lg:block w-72 border-r border-gray-200 dark:border-gray-800">
            <Sidebar />
          </div>

          {/* Mobile Drawer Sidebar */}
          {isOpen && (
            <div className="fixed inset-0 z-40 flex lg:hidden">
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-40"
                onClick={() => setIsOpen(false)}
              ></div>
              {/* Drawer */}
              <div onClick={() => setIsOpen(false)} className="relative z-50 w-72 bg-white dark:bg-gray-900 h-full shadow-lg">
                <Sidebar />
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== Main Content Section ===== */}
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
