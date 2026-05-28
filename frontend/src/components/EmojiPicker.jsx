import React, { useEffect, useRef } from "react";
import "emoji-picker-element";

const EmojiPicker = ({ onSelect }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;

    const handleEmojiClick = (event) => {
      console.log("Emoji clicked event:", event); // <-- debug
      const emoji = event.detail.unicode;
      console.log("Emoji unicode:", emoji);      // <-- debug
      onSelect?.(emoji);
    };

    picker.addEventListener("emoji-click", handleEmojiClick);

    return () => picker.removeEventListener("emoji-click", handleEmojiClick);
  }, [onSelect]);

  return <emoji-picker ref={pickerRef}></emoji-picker>;
};

export default EmojiPicker;
    