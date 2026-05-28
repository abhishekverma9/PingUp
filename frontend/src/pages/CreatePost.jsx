import React, { useState, useRef, useContext } from "react";
import { FiImage, FiX } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

const CreatePostPage = () => {
  const [caption, setCaption] = useState("");
  const { backendUrl, token, getPostsByMe, profileData,fetchFeedPosts,api } = useContext(AuthContext);
  const [isPosting, setIsPosting] = useState(false); // disable button while posting
  const [media, setMedia] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (file.size > maxSize) {
        alert("File is too large. Maximum allowed size is 10MB.");
        e.target.value = null; // reset the input
        return;
      }
      setMedia(file);
    }
  };
  const removeFile = () => {
    setMedia(null);
    fileInputRef.current.value = null; // reset input
  };
  const handlePost = async () => {
    if (!caption.trim() && !media) return;
    setIsPosting(true); // start posting
    const formData = new FormData();
    formData.append("caption", caption);
    if (media) formData.append("media", media);

    try {
      const { data } = await api.post("/api/post/create-post",formData);
      if (data.success) {
        toast.success(data.message);
        getPostsByMe();
        fetchFeedPosts()
        setCaption("");
        setMedia(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsPosting(false); // finished posting
    }
  };

  return (
    <div className="lg:w-[50vw] w-[100vw] min-h-screen font-sans text-gray-800 dark:text-gray-200 transition-colors duration-200">
      <div className="mx-auto p-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">Create Post</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Share your thoughts with the world</p>
        </div>

        {/* Create Post Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
          <div className="flex gap-2">
            {/* Avatar */}
            <img
              src={profileData.profile}
              alt=""
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />

            {/* Post Input Area */}
            <div className="flex-1">
              <div className="mb-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">{profileData.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{profileData.username}</p>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's happening?"
                className="w-full h-24 sm:h-32 p-2 border-none resize-none focus:outline-none text-lg bg-transparent dark:text-gray-100"
              />

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                {/* Media Upload */}
                <FiImage
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-500 cursor-pointer text-2xl"
                  onClick={() => fileInputRef.current.click()}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />

                <button
                  onClick={handlePost}
                  disabled={isPosting || (!caption.trim() && !media)}
                  className={`px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg ${isPosting || !caption.trim()
                    ? "bg-purple-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90"
                    }`}
                >
                  {isPosting ? "Posting..." : "Publish Post"}
                </button>
              </div>

              {/* Media Preview */}
              {media && (
                <div className="relative mt-3 w-full max-h-60 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* Cross Button */}
                  <button
                    onClick={removeFile}
                    type="button"
                    className="absolute top-2 right-2 z-10 bg-black/60 text-white p-1 rounded-full hover:bg-black/80"
                  >
                    <FiX size={18} />
                  </button>

                  {/* Show image or video */}
                  {media.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(media)}
                      alt="preview"
                      className="w-full max-h-60 object-contain relative z-0"
                    />
                  ) : (
                    <video
                      controls
                      className="w-full max-h-60 object-contain relative z-0 pointer-events-auto"
                    >
                      <source src={URL.createObjectURL(media)} type={media.type} />
                    </video>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
