import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const UserCard = ({ user }) => {
  const navigate = useNavigate();
  const { sendFollowRequest, cancelFollowRequest, unfollowUser } = useContext(AuthContext);

  // Local state to track button status
  // Initialize based on backend flags
  const [followState, setFollowState] = useState("follow"); // "follow" | "pending" | "following"

  useEffect(() => {
    if (user.isFollowing) setFollowState("following");
    else if (user.isPending) setFollowState("pending");
    else setFollowState("follow");
  }, [user.isFollowing, user.isPending]);

  const handleFollowToggle = async () => {
    try {
      if (followState === "follow") {
        await sendFollowRequest(user._id);
        setFollowState("pending");
      } else if (followState === "pending") {
        await cancelFollowRequest(user._id);
        setFollowState("follow");
      } else if (followState === "following") {
        await unfollowUser(user._id);
        setFollowState("follow");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  const getButtonText = () => {
    if (followState === "follow") return "Follow";
    if (followState === "pending") return "Pending";
    if (followState === "following") return "Unfollow";
  };

  const getButtonClass = () => {
    if (followState === "follow")
      return "w-full font-semibold py-1 px-2 md:py-2 md:px-4 rounded-lg transition-all duration-300 shadow-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90";
    if (followState === "pending")
      return "w-full font-semibold py-1 px-2 md:py-2 md:px-4 rounded-lg transition-all duration-300 shadow-md bg-yellow-400 text-white hover:opacity-90";
    if (followState === "following")
      return "w-full font-semibold py-1 px-2 md:py-2 md:px-4 rounded-lg transition-all duration-300 shadow-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600";
  };
  const truncateBio = (bio = "") => {
    const words = bio.split(" ");
    return words.length > 16 ? words.slice(0, 16).join(" ") + "..." : bio;
  };
  return (
    <div className="bg-white dark:bg-gray-800 h-[270px] rounded-lg p-2 md:p-6 shadow-md flex flex-col items-center text-center transition-colors duration-200">
      <img
        src={user.profile}
        alt={user.name}
        className="md:w-20 md:h-20 w-12 h-12 rounded-full object-cover mb-2 md:mb-4 ring-2 ring-offset-2 ring-purple-200"
      />
      <p className="font-bold text-sm md:text-lg text-gray-900 dark:text-gray-100">{user.name}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user.username}</p>

      <div className="text-xs text-gray-600 dark:text-gray-300 mb-4">{truncateBio(user.bio)}</div>

      <div className="flex text-xs md:text-sm justify-between gap-2 w-full mt-auto">
        <button onClick={handleFollowToggle} className={getButtonClass()}>
          {getButtonText()}
        </button>

        <button
          onClick={() => navigate(`/friendprofile/${user._id}`)}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-1 px-2 md:py-2 md:px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-md"
        >
          Profile
        </button>
      </div>
    </div>
  );
};

export default UserCard;
