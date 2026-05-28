import React, { useState, useEffect, useRef } from "react";

const MusicPicker = ({ onSelect, onClose, selectedTrack }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const debounceRef = useRef(null);

  const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

  // 🔍 Auto-debounce search
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTracks(query), 500);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const fetchTracks = async (q) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(q)}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": "deezerdevs-deezer.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error("Error fetching music:", err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreview = (url) => {
    if (audioPreview) {
      audioPreview.pause();
      setAudioPreview(null);
    }
    if (url) {
      const audio = new Audio(url);
      audio.play();
      setAudioPreview(audio);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPreview) audioPreview.pause();
    };
  }, [audioPreview]);

  return (
    <div className="absolute bottom-24 left-4 p-4 bg-black/80 rounded-2xl w-80 max-h-96 overflow-y-auto z-50 backdrop-blur-md shadow-lg border border-white/10">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white text-lg font-semibold">🎵 Add Music</h3>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white text-lg font-bold"
        >
          ✖
        </button>
      </div>

      {/* Show selected track (if any) */}
      {selectedTrack && (
        <div className="mb-3 flex items-center justify-between bg-white/10 p-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <img
              src={selectedTrack.album.cover_small}
              alt={selectedTrack.title}
              className="w-10 h-10 rounded"
            />
            <div>
              <p className="text-white text-sm font-semibold">
                {selectedTrack.title}
              </p>
              <p className="text-gray-300 text-xs">{selectedTrack.artist.name}</p>
            </div>
          </div>
          <button
            onClick={() => onSelect(null)} // deselect
            className="text-red-400 hover:text-red-600 text-sm font-semibold"
          >
            ❌
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="flex space-x-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a song..."
          className="flex-1 p-2 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none"
        />
        <button
          onClick={() => fetchTracks(query)}
          disabled={!query}
          className={`${
            query ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"
          } text-white px-3 rounded-lg transition`}
        >
          {isSearching ? "..." : "Go"}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {isSearching && (
          <p className="text-gray-400 text-sm text-center animate-pulse">
            Searching songs...
          </p>
        )}

        {!isSearching && results.length === 0 && query && (
          <p className="text-gray-400 text-sm text-center">No results found 😔</p>
        )}

        {!isSearching && results.length === 0 && !query && (
          <p className="text-gray-400 text-sm text-center">
            Search for songs to add music 🎶
          </p>
        )}

        {results.map((track) => (
          <div
            key={track.id}
            className="flex items-center justify-between bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"
          >
            <div className="flex items-center space-x-2">
              <img
                src={track.album.cover_small}
                alt={track.title}
                className="w-10 h-10 rounded"
              />
              <div>
                <p className="text-white text-sm font-semibold truncate w-32">
                  {track.title}
                </p>
                <p className="text-gray-300 text-xs truncate w-32">
                  {track.artist.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {track.preview && (
                <button
                  onClick={() => handlePreview(track.preview)}
                  className="text-blue-400 text-sm hover:text-blue-600"
                >
                  ▶️
                </button>
              )}
              <button
                onClick={() => {
                  onSelect(track);
                  onClose?.();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicPicker;
