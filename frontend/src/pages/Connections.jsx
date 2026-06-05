import React, { useState, useContext, useEffect } from "react";
import { FiUsers, FiUserPlus, FiClock, FiLink, FiSearch } from "react-icons/fi";
import UserCard from "../components/UserCard";
import { AuthContext } from "../context/AuthContext";

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-1 md:p-4 text-center shadow-md sm:w-full transition-colors duration-200">
    <p className="text-2xl md:text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
  </div>
);

const ConnectionsPage = () => {
  const { connections, fetchAllConnection } = useContext(AuthContext); // followers, following, pending from API
  const [activeTab, setActiveTab] = useState("followers");
  const [searchTerm, setSearchTerm] = useState("");
  const [usersData, setUsersData] = useState({
    followers: [],
    following: [],
    pending: [],
    connections: []
  });

  // Initialize state from context when connections change
  useEffect(() => {
    if (connections) {
      // Merge followers + following and remove duplicates
      const allUsersMap = new Map();
      [...connections.followers, ...connections.following].forEach(user => {
        allUsersMap.set(user._id.toString(), user); // Map ensures unique _id
      });
      const allUsers = Array.from(allUsersMap.values());

      setUsersData({
        followers: connections.followers,
        following: connections.following,
        pending: connections.pending,
        connections: allUsers
      });
    }
  }, [connections]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAllConnection(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);


  const handleFollowToggle = (userId) => {
    // Toggle Follow / Unfollow / Pending state
    const updatedData = { ...usersData };
    ["followers", "following", "pending", "connections"].forEach((key) => {
      updatedData[key] = updatedData[key].map((user) => {
        if (user._id === userId) {
          // Instagram-like toggle logic
          let newState = { ...user };
          if (newState.isPending) {
            newState.isPending = false;
            newState.isFollowing = true; // accepting request
          } else {
            newState.isFollowing = !newState.isFollowing;
          }
          return newState;
        }
        return user;
      });
    });
    setUsersData(updatedData);
  };

  const TABS = {
    followers: { name: "Followers", icon: <FiUsers /> },
    following: { name: "Following", icon: <FiUserPlus /> },
    pending: { name: "Pending", icon: <FiClock /> },
    connections: { name: "Connections", icon: <FiLink /> },
  };

  const currentUsers = usersData[activeTab] || [];

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 font-sans p-4 md:p-6 transition-colors duration-200">
      <div className="max-w-9xl mx-auto">
        {/* Header */}
        <div className="mb-2 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">Connections</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-lg mt-1">
              Manage your network and discover new connections
            </p>
          </div>
          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search connections..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 dark:text-gray-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mb-2 md:mb-6">
          <StatCard title="Followers" value={usersData.followers.length} />
          <StatCard title="Following" value={usersData.following.length} />
          <StatCard title="Pending" value={usersData.pending.length} />
          <StatCard title="Connections" value={usersData.connections.length} />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-md mb-2 md:mb-6 w-full overflow-x-scroll flex justify-around items-center space-x-2 transition-colors duration-200">
          {Object.keys(TABS).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tabKey
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
            >
              {TABS[tabKey].icon}
              <span>{TABS[tabKey].name}</span>
            </button>
          ))}
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
          {currentUsers.map((user) => (
            <UserCard key={user._id} user={user} onFollowToggle={handleFollowToggle} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;
