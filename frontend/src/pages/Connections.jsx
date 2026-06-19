import React, { useState, useContext, useEffect } from "react";
import { FiUsers, FiUserPlus, FiClock, FiLink, FiSearch } from "react-icons/fi";
import UserCard from "../components/UserCard";
import { AuthContext } from "../context/AuthContext";

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md flex items-center gap-4 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 group">
    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
       {icon}
    </div>
    <div>
      <p className="text-2xl font-black text-gray-800 dark:text-gray-100 leading-none">{value}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{title}</p>
    </div>
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
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search connections..."
              className="w-full bg-white dark:bg-gray-800 border-none shadow-sm dark:shadow-none dark:bg-gray-800/80 ring-1 ring-gray-100 dark:ring-gray-700 dark:text-gray-100 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-8">
          <StatCard title="Followers" value={usersData.followers.length} icon={<FiUsers className="w-6 h-6"/>} />
          <StatCard title="Following" value={usersData.following.length} icon={<FiUserPlus className="w-6 h-6"/>} />
          <StatCard title="Pending" value={usersData.pending.length} icon={<FiClock className="w-6 h-6"/>} />
          <StatCard title="Connections" value={usersData.connections.length} icon={<FiLink className="w-6 h-6"/>} />
        </div>

        {/* Tabs */}
        <div className="bg-gray-200/50 dark:bg-gray-800/50 rounded-2xl p-1.5 mb-6 w-full overflow-x-auto flex justify-start items-center gap-1 no-scrollbar whitespace-nowrap transition-colors duration-200 backdrop-blur-sm">
          {Object.keys(TABS).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`flex-1 flex items-center justify-center min-w-[120px] gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tabKey
                  ? "bg-white text-purple-600 shadow-sm dark:bg-gray-700 dark:text-purple-400 scale-[1.02]"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
            >
              {TABS[tabKey].icon}
              <span>{TABS[tabKey].name}</span>
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="flex flex-col gap-3 pb-8">
          {currentUsers.map((user) => (
            <UserCard key={user._id} user={user} onFollowToggle={handleFollowToggle} />
          ))}
          {currentUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                <div className="relative mb-6 group cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-emerald-500 blur-2xl opacity-20 dark:opacity-30 rounded-full group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-full shadow-inner border border-white/50 dark:border-gray-600">
                        <FiUsers className="text-5xl text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-500 ease-out" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-sans tracking-tight">No Users Found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm text-base leading-relaxed">
                    Looks like it's quiet here. Try finding more people to build your network!
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;
