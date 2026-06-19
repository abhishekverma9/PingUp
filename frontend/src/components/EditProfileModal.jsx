import React, { useContext, useState,useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const EditProfileModal = ({ onClose }) => {
  const { getProfileData, profileData, api } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateData, setUpdateData] = useState({
    name: "", username: "", bio: "", location: "", profile: null, cover: null
  });
  // ✅ Pre-fill with existing profile data when modal opens / profileData changes
  useEffect(() => {
    if (!profileData) return;
    setUpdateData(prev => ({
      ...prev,
      name: profileData.name || "",
      username: profileData.username || "",
      bio: profileData.bio || "",
      location: profileData.location || "",
    }));
  }, [profileData]);

  const updateProfileData = async () => {
    try {
      setIsSubmitting(true); // start submitting
      const formData = new FormData();
      formData.append("profile", updateData.profile);
      formData.append("cover", updateData.cover);
      formData.append("name", updateData.name);
      formData.append("username", updateData.username);
      formData.append("bio", updateData.bio);
      formData.append("location", updateData.location);

      const { data } = await api.post('/api/user/update-profiledata', formData);
      if (data.success) {
        getProfileData();
        toast.success(data.message);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-7 rounded-xl shadow-lg w-full max-w-lg space-y-0 transition-colors duration-200">
        <h2 className="text-xl font-semibold py-1 text-slate-900 dark:text-gray-100">Edit Profile</h2>

        {/* Cover Photo */}
        <div className="relative">
          <img
            src={updateData.cover ? URL.createObjectURL(updateData.cover) : profileData.cover || "https://plus.unsplash.com/premium_photo-1673177667569-e3321a8d8256?fm=jpg&q=60&w=3000"}
            alt="Cover"
            className="w-full h-20 md:h-32 rounded-lg object-cover"
          />
          <label className="absolute top-2 right-2 bg-white dark:bg-gray-700 px-3 py-1 text-sm rounded-lg shadow cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-600 dark:text-gray-200 transition">
            Change
            <input
              type="file"
              className="hidden"
              onChange={(e) => setUpdateData(prev => ({ ...prev, cover: e.target.files[0] }))}
            />
          </label>
        </div>

        {/* Profile Photo */}
        <div className="relative flex justify-center -mt-10">
          <img
            src={updateData.profile ? URL.createObjectURL(updateData.profile) : profileData.profile || "https://plus.unsplash.com/premium_photo-1673177667569-e3321a8d8256?fm=jpg&q=60&w=3000"}
            alt="Profile"
            className="w-14 h-14 md:w-24 md:h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover"
          />
          <label className="absolute bottom-0 right-[38%] bg-white dark:bg-gray-700 px-2 py-1 text-xs rounded-lg shadow cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-600 dark:text-gray-200 transition">
            Change
            <input
              type="file"
              className="hidden"
              onChange={(e) => setUpdateData(prev => ({ ...prev, profile: e.target.files[0] }))}
            />
          </label>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={updateData.name}
              onChange={(e) => setUpdateData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={updateData.username}
              onChange={(e) => setUpdateData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">Bio</label>
            <textarea
              rows="4"
              value={updateData.bio}
              onChange={(e) => setUpdateData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={updateData.location}
              onChange={(e) => setUpdateData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="px-6 py-2 text-sm font-semibold bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-full hover:bg-slate-200 transition"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-6 py-2 text-sm font-semibold rounded-full transition ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 shadow-lg shadow-purple-200 dark:shadow-none"}`}
            onClick={updateProfileData}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
