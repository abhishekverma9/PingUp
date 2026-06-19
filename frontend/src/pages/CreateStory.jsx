import React, { useRef, useState, useEffect, useContext,useCallback } from "react";
import {
  FiImage,
  FiSend,
  FiCrop,
  FiType,
  FiSmile,
  FiMusic,
  FiChevronLeft,
  FiX,
} from "react-icons/fi";
import { PiSparkleBold } from "react-icons/pi";
import { IoIosColorPalette } from "react-icons/io";
import EmojiPicker from "../components/EmojiPicker";
import MusicPicker from "../components/MusicPicker";
import axios from 'axios'
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { useNavigate } from 'react-router-dom';

const topIcons = [
  <FiCrop key="crop" />,
  <FiType key="type" />,
  <FiSmile key="smile" />,
  <PiSparkleBold key="sparkle" />,
  <FiMusic key="music" />,
];
const fonts = [
  { name: "Arial", style: "normal", weight: "400", color: "#ffffff" },
  { name: "Courier New", style: "italic", weight: "700", color: "#ffcc00" },
  { name: "Times New Roman", style: "normal", weight: "500", color: "#00ffcc" },
  { name: "MyFont1", style: "normal", weight: "400", color: "#ff6699" },
  { name: "MyFont2", style: "normal", weight: "600", color: "#66ff99" },
];

const CreateStoryComposer = ({ onClose }) => {
  const previewRef = useRef(null);
  const composerRef = useRef(null); //new
  const emojiContainerRef = useRef(null);
  const fileInputRef = useRef(null)
  const { token, backendUrl, fetchAllStories, api, users } = useContext(AuthContext)
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSearch, setSuggestionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [showTextTool, setShowTextTool] = useState(false);
  const [showEmojiTool, setShowEmojiTool] = useState(false);
  const [emojis, setEmojis] = useState([]);
  const [showFilterTool, setShowFilterTool] = useState(false);
  const [showMusicTool, setShowMusicTool] = useState(false);
  const [showColorTool, setShowColorTool] = useState(false);
  const [music, setMusic] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(null);

  // Image drag & zoom
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1); // zoom scale
  const [origin, setOrigin] = useState({ x: 0, y: 0 }); // zoom origin
  const [musicPosition, setMusicPosition] = useState({ x: 100, y: 400 });
  const [isDraggingMusic, setIsDraggingMusic] = useState(false);
  const [selectedFont, setSelectedFont] = useState(fonts[0]);

  // For pinch gestures
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);

  // Draggable Text State
  const [textPosition, setTextPosition] = useState({ x: 100, y: 200 });
  const [isDragging, setIsDragging] = useState(false);

  const handleEmojiSelect = (emoji) => {
    if (!emojiContainerRef.current) return;
    const rect = emojiContainerRef.current.getBoundingClientRect();
    const newEmoji = {
      emoji,
      x: rect.width / 2 - 20,
      y: rect.height / 2 - 20,
    };
    setEmojis((prev) => [...prev, newEmoji]);
    setShowEmojiTool(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setMediaFile(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setMediaFile(croppedImage);
      setPreview(URL.createObjectURL(croppedImage));
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

  const getDistance = (touch1, touch2) => {
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  }
  // const handleShare = async () => {
  //   if (!preview && !caption.trim() && emojis.length === 0 && !music) return;

  //   try {
  //     const formData = new FormData();

  //     // Attach media file if exists
  //     if (fileInputRef.current?.files[0]) {
  //       const file = fileInputRef.current.files[0];
  //       formData.append("file", file);
  //       // mediaType is optional on backend; you can keep it
  //       formData.append(
  //         "mediaType",
  //         file.type.startsWith("video") ? "video" : "image"
  //       );
  //     }

  //     // Attach optional story elements
  //     if (caption.trim()) {
  //       formData.append(
  //         "caption",
  //         JSON.stringify({
  //           content: caption,
  //           position: textPosition,
  //           font: selectedFont,
  //         })
  //       );
  //     }
  //     if (emojis.length) {
  //       formData.append(
  //         "emojis",
  //         JSON.stringify(
  //           emojis.map((e) => ({ emoji: e.emoji, position: { x: e.x, y: e.y } }))
  //         )
  //       );
  //     }
  //     if (music) {
  //       const cleanMusic = {
  //         id: music.id,
  //         title: music.title,
  //         artist:
  //           typeof music.artist === "object" ? music.artist.name : music.artist,
  //         albumCover:
  //           music.album?.cover_medium ||
  //           music.album?.cover_small ||
  //           music.cover ||
  //           "",
  //         preview: music.preview,
  //         position: musicPosition,
  //       };
  //       formData.append("music", JSON.stringify(cleanMusic));
  //     }
  //     formData.append("backgroundColor", bgColor);

  //     const { data } = await api.post(`/api/story/create`, formData);
  //     if (data.success) {
  //       toast.success(data.message);
  //       fetchAllStories()
  //       setCaption("");
  //       setPreview(null);
  //       setBgColor("#ffffff");
  //       setEmojis([]);
  //       setMusic(null);
  //       setTextPosition({ x: 100, y: 200 });
  //       setMusicPosition({ x: 100, y: 400 });
  //       if (fileInputRef.current) fileInputRef.current.value = null;
  //     } else {
  //       toast.error(data.message);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     toast.error(err.response?.data?.message || err.message);
  //   }
  // };

  const handleShare = async () => {
    if (!preview && !caption.trim() && emojis.length === 0 && !music) return;

    try {
      const formData = new FormData();

      // 👇 1. Get container dimensions to convert pixels to percentages
      const rect = composerRef.current.getBoundingClientRect();
      const cw = rect.width || 1;
      const ch = rect.height || 1;

      // Helper function to convert exact pixels to fluid percentages
      const toPercent = (x, y) => ({
        x: `${(x / cw) * 100}%`,
        y: `${(y / ch) * 100}%`,
      });

      if (mediaFile) {
        formData.append("file", mediaFile);
        formData.append("mediaType", mediaFile.type.startsWith("video") ? "video" : "image");

        // 👇 2. Save the zoom & drag settings of the image!
        const imgSettings = {
          left: `${(imagePosition.x / cw) * 100}%`,
          top: `${(imagePosition.y / ch) * 100}%`,
          scale: scale,
          originX: `${(origin.x / cw) * 100}%`,
          originY: `${(origin.y / ch) * 100}%`
        };
        formData.append("imageSettings", JSON.stringify(imgSettings));
      }

      if (caption.trim()) {
        formData.append(
          "caption",
          JSON.stringify({
            content: caption,
            position: toPercent(textPosition.x, textPosition.y), // 👈 Converted to %
            font: selectedFont,
          })
        );
      }
      if (emojis.length) {
        formData.append(
          "emojis",
          JSON.stringify(
            emojis.map((e) => ({
              emoji: e.emoji,
              // Emojis are visually offset by imagePosition, so we combine them before converting
              position: toPercent(e.x + imagePosition.x, e.y + imagePosition.y),
            }))
          )
        );
      }
      if (music) {
        const cleanMusic = {
          id: music.id,
          title: music.title,
          artist: typeof music.artist === "object" ? music.artist.name : music.artist,
          albumCover: music.album?.cover_medium || music.album?.cover_small || music.cover || "",
          preview: music.preview,
          position: toPercent(musicPosition.x, musicPosition.y), // 👈 Converted to %
        };
        formData.append("music", JSON.stringify(cleanMusic));
      }
      formData.append("backgroundColor", bgColor);

      const { data } = await api.post(`/api/story/create`, formData);
      if (data.success) {
        toast.success(data.message);
        fetchAllStories();
        setCaption("");
        setPreview(null);
        setBgColor("#ffffff");
        setEmojis([]);
        setMusic(null);
        setTextPosition({ x: 100, y: 200 });
        setMusicPosition({ x: 100, y: 400 });
        if (fileInputRef.current) fileInputRef.current.value = null;
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const removePreview = () => {
    setPreview(null);
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };
  useEffect(() => {
    // Stop any existing playback
    if (audioPlayer) {
      audioPlayer.pause();
      setAudioPlayer(null);
    }

    // If a track is selected, start preview playback
    if (music && music.preview) {
      const newAudio = new Audio(music.preview);
      newAudio.loop = true; // loop preview (optional)
      newAudio.play().catch((err) => console.warn("Playback blocked:", err));
      setAudioPlayer(newAudio);
    }

    // Stop audio on cleanup
    return () => {
      if (audioPlayer) audioPlayer.pause();
    };
  }, [music]);

  // --- Fix passive event listener for wheel ---
  useEffect(() => {
    const img = previewRef.current;
    if (!img) return;

    const handleWheel = (e) => {
      e.preventDefault(); // safe now
      const zoomAmount = e.deltaY < 0 ? 0.1 : -0.1;
      setScale((prev) => Math.min(Math.max(prev + zoomAmount, 1), 4));
    };

    img.addEventListener("wheel", handleWheel, { passive: false });

    return () => img.removeEventListener("wheel", handleWheel);
  }, [preview]);

  // --- Optional: prevent pinch scrolling on mobile ---
  useEffect(() => {
    const img = previewRef.current;
    if (!img) return;

    const handleTouchMove = (e) => {
      e.preventDefault();
    };

    img.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => img.removeEventListener("touchmove", handleTouchMove);
  }, [preview]);

  return (
    <div ref={composerRef}
      className="w-full h-full text-white overflow-hidden flex flex-col rounded-2xl"
      style={{ backgroundColor: bgColor }}
    >

      {preview ? (
        <div ref={emojiContainerRef}
          className=" w-full h-full flex items-center justify-center overflow-hidden"
        >
          {/* Image */}
          <img
            ref={previewRef} // ✅ add ref here
            src={preview}
            alt="Story Preview"
            className="select-none object-contain"
            style={{
              position: "absolute",
              left: `${imagePosition.x}px`,
              top: `${imagePosition.y}px`,
              transform: `scale(${scale})`,
              transformOrigin: `center center`,
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
              zIndex: 1,
            }}
            draggable={false}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsImageDragging(true);
              setImageDragStart({
                x: e.clientX - imagePosition.x,
                y: e.clientY - imagePosition.y,
              });
            }}
            onMouseMove={(e) => {
              if (isImageDragging) {
                setImagePosition({
                  x: e.clientX - imageDragStart.x,
                  y: e.clientY - imageDragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsImageDragging(false)}
            onMouseLeave={() => setIsImageDragging(false)}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                const touch = e.touches[0];
                setIsImageDragging(true);
                setImageDragStart({
                  x: touch.clientX - imagePosition.x,
                  y: touch.clientY - imagePosition.y,
                });
              } else if (e.touches.length === 2) {
                // Pinch to zoom
                const dist = getDistance(e.touches[0], e.touches[1]);
                setTouchStartDistance(dist);
                setInitialScale(scale);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 1 && isImageDragging) {
                const touch = e.touches[0];
                setImagePosition({
                  x: touch.clientX - imageDragStart.x,
                  y: touch.clientY - imageDragStart.y,
                });
              } else if (e.touches.length === 2 && touchStartDistance > 0) {
                const newDist = getDistance(e.touches[0], e.touches[1]);
                const newScale = initialScale * (newDist / touchStartDistance);
                setScale(Math.min(Math.max(newScale, 1), 4));
              }
            }}
            onTouchEnd={() => {
              setIsImageDragging(false);
              setTouchStartDistance(0);
              setInitialScale(scale);
            }}
          />
          {/* Emojis */}
          {emojis.map((item, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${item.x + imagePosition.x}px`,
                top: `${item.y + imagePosition.y}px`,
                fontSize: "2rem",
                cursor: "grab",
                userSelect: "none",
                zIndex: 50,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX - item.x;
                const startY = e.clientY - item.y;

                const onMouseMove = (e) => {
                  setEmojis((prev) => {
                    const newEmojis = [...prev];
                    newEmojis[index] = {
                      ...newEmojis[index],
                      x: e.clientX - startX,
                      y: e.clientY - startY,
                    };
                    return newEmojis;
                  });
                };

                const onMouseUp = () => {
                  window.removeEventListener("mousemove", onMouseMove);
                  window.removeEventListener("mouseup", onMouseUp);
                };

                window.addEventListener("mousemove", onMouseMove);
                window.addEventListener("mouseup", onMouseUp);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                const startX = touch.clientX - item.x;
                const startY = touch.clientY - item.y;

                const onTouchMove = (ev) => {
                  ev.preventDefault(); // prevent scrolling
                  const touchMove = ev.touches[0];
                  setEmojis((prev) => {
                    const newEmojis = [...prev];
                    newEmojis[index] = {
                      ...newEmojis[index],
                      x: touchMove.clientX - startX,
                      y: touchMove.clientY - startY,
                    };
                    return newEmojis;
                  });
                };

                const onTouchEnd = () => {
                  window.removeEventListener("touchmove", onTouchMove);
                  window.removeEventListener("touchend", onTouchEnd);
                };

                window.addEventListener("touchmove", onTouchMove, { passive: false });
                window.addEventListener("touchend", onTouchEnd);
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={emojiContainerRef}
          className="absolute inset-0 w-full h-full"
          style={{ backgroundColor: bgColor }}
        >
          {emojis.map((item, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${item.x + imagePosition.x}px`,
                top: `${item.y + imagePosition.y}px`,
                fontSize: "2rem",
                cursor: "grab",
                userSelect: "none",
                zIndex: 10,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX - item.x;
                const startY = e.clientY - item.y;

                const onMouseMove = (e) => {
                  setEmojis((prev) => {
                    const newEmojis = [...prev];
                    newEmojis[index] = {
                      ...newEmojis[index],
                      x: e.clientX - startX,
                      y: e.clientY - startY,
                    };
                    return newEmojis;
                  });
                };

                const onMouseUp = () => {
                  window.removeEventListener("mousemove", onMouseMove);
                  window.removeEventListener("mouseup", onMouseUp);
                };

                window.addEventListener("mousemove", onMouseMove);
                window.addEventListener("mouseup", onMouseUp);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                const touch = e.touches[0];
                const startX = touch.clientX - item.x;
                const startY = touch.clientY - item.y;

                const onTouchMove = (ev) => {
                  ev.preventDefault(); // prevent scrolling
                  const touchMove = ev.touches[0];
                  setEmojis((prev) => {
                    const newEmojis = [...prev];
                    newEmojis[index] = {
                      ...newEmojis[index],
                      x: touchMove.clientX - startX,
                      y: touchMove.clientY - startY,
                    };
                    return newEmojis;
                  });
                };

                const onTouchEnd = () => {
                  window.removeEventListener("touchmove", onTouchMove);
                  window.removeEventListener("touchend", onTouchEnd);
                };

                window.addEventListener("touchmove", onTouchMove, { passive: false });
                window.addEventListener("touchend", onTouchEnd);
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={onClose}
          className="p-2 bg-black/40 rounded-full hover:bg-opacity-60 transition"
        >
          <FiChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Editing Tools (Top-right) */}
      <div className="absolute top-4 right-4 flex flex-col items-end z-30 space-y-2">
        <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md p-2 rounded-full">

          {/* Crop Tool */}
          <button
            className="p-2 rounded-full hover:bg-black/50"
            onClick={() => {
              if (mediaFile && mediaFile.type.startsWith("image/")) {
                setImageToCrop(preview);
                setShowCropper(true);
              } else {
                toast.error("Upload an image first to crop it");
              }
            }}
            title="Crop Image"
          >
            <FiCrop className="w-5 h-5 text-white" />
          </button>

          {/* Text Tool */}
          <button
            className={`p-2 rounded-full transition-all duration-200 ${showTextTool ? "bg-blue-600 shadow-md shadow-blue-400" : "hover:bg-black/50"
              }`}
            onClick={() => {
              setShowTextTool(!showTextTool);
              setShowEmojiTool(false);
              setShowFilterTool(false);
              setShowMusicTool(false);
              setShowColorTool(false);
            }}
          >
            <FiType className="w-5 h-5 text-white" />
          </button>

          {/* Emoji Tool */}
          <button
            className={`p-2 rounded-full transition-all duration-200 ${showEmojiTool ? "bg-blue-600 shadow-md shadow-blue-400" : "hover:bg-black/50"
              }`}
            onClick={() => {
              setShowEmojiTool(!showEmojiTool);
              setShowTextTool(false);
              setShowFilterTool(false);
              setShowMusicTool(false); setShowColorTool(false);
            }}
          >
            <FiSmile className="w-5 h-5 text-white" />
          </button>

          {/* Filter Tool */}
          <button
            className={`p-2 rounded-full transition-all duration-200 ${showFilterTool ? "bg-blue-600 shadow-md shadow-blue-400" : "hover:bg-black/50"
              }`}
            onClick={() => {
              setShowFilterTool(!showFilterTool);
              setShowTextTool(false);
              setShowEmojiTool(false);
              setShowMusicTool(false); setShowColorTool(false);
            }}
          >
            <PiSparkleBold className="w-5 h-5 text-white" />
          </button>

          {/* Background Color Tool */}
          <div
            className={`relative p-2 rounded-full transition-all duration-200 ${showColorTool ? "bg-blue-600 shadow-md shadow-blue-400" : "hover:bg-black/50"
              }`}
            onClick={() => {
              setShowColorTool(!showColorTool);
              setShowTextTool(false);
              setShowEmojiTool(false);
              setShowFilterTool(false);
              setShowMusicTool(false);
            }}
          >
            <IoIosColorPalette
              className="w-6 h-6 text-white cursor-pointer hover:text-blue-400"
              title="Select Background Color"
              style={{ color: bgColor }}
            />
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
          </div>

          {/* Music Tool */}
          <button
            className={`p-2 rounded-full transition-all duration-200 ${showMusicTool ? "bg-blue-600 shadow-md shadow-blue-400" : "hover:bg-black/50"
              }`}
            onClick={() => {
              setShowMusicTool(!showMusicTool);
              setShowTextTool(false);
              setShowEmojiTool(false);
              setShowFilterTool(false); setShowColorTool(false);
            }}
          >
            <FiMusic className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Remove Preview */}
        {preview && (
          <button
            onClick={removePreview}
            className="p-2 mt-2 bg-black/50 rounded-full hover:bg-black/70 transition"
          >
            <FiX className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {showColorTool && (
        <div className="absolute top-20 right-4 z-[60] bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
          {["#ffffff", "#000000", "#ff4757", "#2ed573", "#1e90ff", "#ffa502"].map((color) => (
            <button
              key={color}
              onClick={() => {
                setBgColor(color);
                setShowColorTool(false);
              }}
              className={`w-8 h-8 rounded-full border-2 ${bgColor === color ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
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
                aspect={9/16}
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

      {/* Draggable Caption Input */}
      <div
        className="absolute z-20"
        style={{
          left: `${textPosition.x}px`,
          top: `${textPosition.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          const startX = e.clientX - textPosition.x;
          const startY = e.clientY - textPosition.y;

          const onMouseMove = (e) => setTextPosition({ x: e.clientX - startX, y: e.clientY - startY });

          const onMouseUp = () => {
            setIsDragging(false);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
          };

          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          const touch = e.touches[0];
          const startX = touch.clientX - textPosition.x;
          const startY = touch.clientY - textPosition.y;

          const onTouchMove = (ev) => {
            ev.preventDefault();
            const touchMove = ev.touches[0];
            setTextPosition({ x: touchMove.clientX - startX, y: touchMove.clientY - startY });
          };

          const onTouchEnd = () => {
            setIsDragging(false);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
          };

          window.addEventListener("touchmove", onTouchMove, { passive: false });
          window.addEventListener("touchend", onTouchEnd);
        }}
      >
        <textarea
          value={caption}
          onChange={handleTextareaChange}
          onClick={(e) => setCursorPosition(e.target.selectionStart)}
          onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
          placeholder="Start typing..."
          className="w-64 text-center bg-transparent text-white placeholder-gray-300 text-2xl sm:text-3xl font-semibold resize-none focus:outline-none focus:ring-0 leading-tight transition-all duration-300"
          rows={2}
          style={{
            fontFamily: selectedFont.name,
            fontWeight: selectedFont.weight,
            fontStyle: selectedFont.style,
            color: selectedFont.color,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        />
        {/* Autocomplete Dropdown */}
        {showSuggestions && users && (
          <div 
            className="absolute z-50 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto left-0 top-full mt-2"
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking dropdown
            onTouchStart={(e) => e.stopPropagation()}
          >
            {users
              .filter((u) => 
                u.username.toLowerCase().includes(suggestionSearch) || 
                u.name.toLowerCase().includes(suggestionSearch)
              )
              .slice(0, 10)
              .map((u) => (
                <div 
                  key={u.id} 
                  onClick={() => handleSelectMention(u.username)}
                  className="flex items-center gap-3 p-3 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 text-left"
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
      {music && (
        <div
          className="absolute z-50 cursor-grab"
          style={{
            left: `${musicPosition.x}px`,
            top: `${musicPosition.y}px`,
            cursor: isDraggingMusic ? "grabbing" : "grab",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingMusic(true);
            const startX = e.clientX - musicPosition.x;
            const startY = e.clientY - musicPosition.y;

            const onMouseMove = (e) => {
              setMusicPosition({
                x: e.clientX - startX,
                y: e.clientY - startY,
              });
            };

            const onMouseUp = () => {
              setIsDraggingMusic(false);
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsDraggingMusic(true);
            const touch = e.touches[0];
            const startX = touch.clientX - musicPosition.x;
            const startY = touch.clientY - musicPosition.y;

            const onTouchMove = (ev) => {
              ev.preventDefault();
              const touchMove = ev.touches[0];
              setMusicPosition({
                x: touchMove.clientX - startX,
                y: touchMove.clientY - startY,
              });
            };

            const onTouchEnd = () => {
              setIsDraggingMusic(false);
              window.removeEventListener("touchmove", onTouchMove);
              window.removeEventListener("touchend", onTouchEnd);
            };

            window.addEventListener("touchmove", onTouchMove, { passive: false });
            window.addEventListener("touchend", onTouchEnd);
          }}
          onMouseLeave={() => isDraggingMusic && setIsDraggingMusic(false)}
        >
          {/* Music player content */}
          <div className="bg-black/60 px-4 py-2 rounded-full flex items-center space-x-3">
            <img
              src={music.album.cover_small}
              alt={music.title}
              className="w-8 h-8 rounded"
            />
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold truncate w-40">
                {music.title}
              </span>
              <span className="text-gray-300 text-xs truncate w-40">
                {music.artist.name}
              </span>
            </div>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <span
                  key={i}
                  className="w-1 h-3 bg-green-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <button
              onClick={() => setMusic(null)}
              className="text-red-400 hover:text-red-600 ml-2"
              title="Remove music"
            >
              ❌
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 flex justify-around gap-6 bg-gradient-to-t from-black/40 to-transparent">
        <label className="bg-white/20 backdrop-blur-md p-4 rounded-full cursor-pointer hover:bg-white/30 transition">
          <FiImage className="w-5 h-5 text-white" />
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
        </label>

        <button
          onClick={handleShare}
          disabled={
            !caption.trim() && emojis.length === 0 && !preview && !music
          }
          className={`p-4 rounded-full transition ${caption.trim() || emojis.length > 0 || preview || music
            ? "bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-200 hover:opacity-90"
            : "bg-neutral-700 cursor-not-allowed"
            }`}
        >
          <FiSend className="w-5 h-5 text-white" />
        </button>

      </div>

      {/* Optional Tool Panels */}
      {showTextTool && (
        <div className="absolute bottom-24 left-4 p-2 bg-black/50 rounded-md flex space-x-2 z-20">
          {fonts.map((f) => (
            <button
              key={f.name}
              onClick={() => { setSelectedFont(f); setShowTextTool(!showTextTool) }}
              style={{ fontFamily: f.name, fontWeight: f.weight, fontStyle: f.style, color: f.color }}
              className={`px-2 py-1 rounded ${selectedFont.name === f.name ? "bg-blue-600" : "bg-black/30"
                }`}
            >
              Aa
            </button>
          ))}
        </div>
      )}

      {showEmojiTool && (
        <div className="absolute bottom-24 left-4 z-20 p-2 bg-black/50 rounded-md" style={{ cursor: "pointer" }}>
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
      )}
      {showMusicTool && (
        <MusicPicker
          onSelect={(track) => setMusic(track)}
          onClose={() => setShowMusicTool(false)}
          selectedTrack={music}
        />
      )}

      {showFilterTool && <div className="absolute bottom-24 left-4 p-2 bg-black/50 rounded-md z-20">Filter Panel</div>}
    </div>
  );
};

export default CreateStoryComposer;
