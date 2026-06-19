import React, { useState, useRef, useContext, useCallback } from "react";
import { FiImage, FiX } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const CreatePostPage = () => {
  const [caption, setCaption] = useState("");
  const { backendUrl, token, getPostsByMe, profileData,fetchFeedPosts,api, users } = useContext(AuthContext);
  const [isPosting, setIsPosting] = useState(false); // disable button while posting
  const [media, setMedia] = useState(null);
  const fileInputRef = useRef(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSearch, setSuggestionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (file.size > maxSize) {
        alert("File is too large. Maximum allowed size is 10MB.");
        e.target.value = null; // reset the input
        return;
      }
      if (file.type.startsWith("image/")) {
        setImageToCrop(URL.createObjectURL(file));
        setShowCropper(true);
      } else {
        setMedia(file);
      }
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setMedia(croppedImage);
      setShowCropper(false);
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to crop image");
    }
  };

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    setCaption(val);
    const cursor = e.target.selectionStart;
    setCursorPosition(cursor);

    const textBeforeCursor = val.substring(0, cursor);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtPos !== -1 && (lastAtPos === 0 || textBeforeCursor[lastAtPos - 1] === " " || textBeforeCursor[lastAtPos - 1] === "\n")) {
      const searchStr = textBeforeCursor.substring(lastAtPos + 1);
      if (!searchStr.includes(" ") && !searchStr.includes("\n")) {
        setSuggestionSearch(searchStr.toLowerCase());
        setShowSuggestions(true);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const handleSelectMention = (username) => {
    const textBeforeCursor = caption.substring(0, cursorPosition);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = caption.substring(cursorPosition);
    
    const newTextBefore = textBeforeCursor.substring(0, lastAtPos + 1) + username + " ";
    setCaption(newTextBefore + textAfterCursor);
    setShowSuggestions(false);
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
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsPosting(false); // finished posting
    }
  };

  return (
    <div className="w-full lg:max-w-3xl min-h-screen font-sans text-gray-800 dark:text-gray-200 transition-colors duration-200 mx-auto">
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

              <div className="relative">
                <textarea
                  value={caption}
                  onChange={handleTextareaChange}
                  onClick={(e) => setCursorPosition(e.target.selectionStart)}
                  onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
                  placeholder="What's happening?"
                  className="w-full h-24 sm:h-32 p-2 border-none resize-none focus:outline-none text-lg bg-transparent dark:text-gray-100"
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && users && (
                  <div className="absolute z-10 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto left-2 top-full mt-1">
                    {users
                      .filter((u) => 
                        u.username.toLowerCase().includes(suggestionSearch) || 
                        u.name.toLowerCase().includes(suggestionSearch)
                      )
                      .slice(0, 10) // Limit to 10 suggestions
                      .map((u) => (
                        <div 
                          key={u.id} 
                          onClick={() => handleSelectMention(u.username)}
                          className="flex items-center gap-3 p-3 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                        >
                          <img src={u.profile_pic || u.profile} alt={u.username} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight">{u.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</span>
                          </div>
                        </div>
                    ))}
                    {users.filter(u => u.username.toLowerCase().includes(suggestionSearch) || u.name.toLowerCase().includes(suggestionSearch)).length === 0 && (
                      <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">No users found</div>
                    )}
                  </div>
                )}
              </div>

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

      {/* Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold dark:text-white">Crop Image</h3>
              <button onClick={() => { setShowCropper(false); setImageToCrop(null); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="relative flex-1 w-full bg-gray-900 rounded-lg overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center gap-4 px-4">
                <span className="text-sm font-medium dark:text-gray-300">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowCropper(false); setImageToCrop(null); }}
                  className="px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropImage}
                  className="px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 transition-opacity shadow-lg"
                >
                  Crop & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostPage;
