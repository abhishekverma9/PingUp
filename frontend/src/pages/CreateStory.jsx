import React, { useRef, useState, useEffect, useContext } from "react";
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
  const { token, backendUrl, fetchAllStories, api } = useContext(AuthContext)
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
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
    if (file) setPreview(URL.createObjectURL(file));
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

      if (fileInputRef.current?.files[0]) {
        const file = fileInputRef.current.files[0];
        formData.append("file", file);
        formData.append("mediaType", file.type.startsWith("video") ? "video" : "image");

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

      const rect = img.getBoundingClientRect();
      setOrigin({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    img.addEventListener("wheel", handleWheel, { passive: false });

    return () => img.removeEventListener("wheel", handleWheel);
  }, [preview]);

  // --- Optional: prevent pinch scrolling on mobile ---
  useEffect(() => {
    const img = previewRef.current;
    if (!img) return;

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) e.preventDefault();
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
              transformOrigin: `${origin.x}px ${origin.y}px`,
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
                const d = getDistance(e.touches[0], e.touches[1]);
                setTouchStartDistance(d);
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
                const newDistance = getDistance(e.touches[0], e.touches[1]);
                const scaleFactor = newDistance / touchStartDistance;
                const newScale = Math.min(Math.max(initialScale * scaleFactor, 1), 4);
                setScale(newScale);
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
            onClick={() => alert("Crop tool active")}
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
      >
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
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
            ? "bg-blue-600 hover:bg-blue-700"
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
