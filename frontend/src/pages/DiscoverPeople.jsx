import React, { useContext, useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import UserCard from "../components/UserCard";
import { AuthContext } from "../context/AuthContext";

const DiscoverPeoplePage = () => {
  const { discoverPeople, fetchDiscoverPeople } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDiscoverPeople(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-2 md:p-6">
        {/* Header */}
        <div className="mb-2 md:mb-6">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Discover People</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Connect with amazing people and grow your network
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2 md:mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search people by name, username, or tags..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 dark:text-gray-100 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-6">
          {discoverPeople.length > 0 ? (
            discoverPeople.map((user) => (
              <UserCard key={user._id} user={user} />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 col-span-full text-center">
              No users found matching “{searchTerm}”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPeoplePage;
