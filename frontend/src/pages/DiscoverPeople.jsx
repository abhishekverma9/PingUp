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
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-gray-800 dark:text-gray-100 mb-3 tracking-tight">Discover People</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-lg">
            Connect with amazing people and grow your network
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 md:mb-10 group max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 group-focus-within:text-purple-500 transition-colors w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search people by name, username..."
            className="w-full bg-white dark:bg-gray-800 border-none shadow-md dark:shadow-none dark:bg-gray-800/80 ring-1 ring-gray-100 dark:ring-gray-700 dark:text-gray-100 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all font-medium text-base md:text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* User Grid */}
        {/* User List */}
        <div className="flex flex-col gap-3 pb-8 max-w-2xl mx-auto">
          {discoverPeople.length > 0 ? (
            discoverPeople.map((user) => (
              <UserCard key={user._id} user={user} />
            ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 mt-4">
              <FiSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                No users found matching “{searchTerm}”.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPeoplePage;
