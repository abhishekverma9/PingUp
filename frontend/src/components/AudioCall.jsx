import React, { useEffect, useRef, useState, useContext } from "react";
import Peer from "simple-peer";
import { SocketContext } from "../context/SocketContext";
import { FiPhone, FiPhoneOff, FiMic, FiMicOff } from "react-icons/fi";

const AudioCall = ({ currentUserId, otherUserId, onClose }) => {
  const { socket, incomingCall, answerCall, startCall, endCall } = useContext(SocketContext);
  const [callAccepted, setCallAccepted] = useState(false);
  const [peerObj, setPeerObj] = useState(null);
  const peerRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localAudioRef = useRef();
  const remoteAudioRef = useRef();

  // Get microphone stream
  useEffect(() => {
    let streamRef = null;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setLocalStream(stream);
        streamRef = stream;
        if (localAudioRef.current) localAudioRef.current.srcObject = stream;
      })
      .catch(err => console.error("Error accessing microphone:", err));

    return () => {
      // Cleanup tracks on unmount
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  // ✅ Auto-call if we are the initiator (i.e., there is no incoming call)
  useEffect(() => {
    if (!incomingCall && localStream && !peerObj) {
      handleCallUser();
    }
  }, [localStream, incomingCall]);

  // ✅ Listen for the receiver accepting the call
  useEffect(() => {
    if (!socket) return;
    
    const handleCallAccepted = (signal) => {
      setCallAccepted(true);
      // Finalize the WebRTC connection by passing the receiver's signal to our peer
      if (peerObj) {
        peerObj.signal(signal);
      }
    };

    socket.on("callAccepted", handleCallAccepted);
    return () => socket.off("callAccepted", handleCallAccepted);
  }, [socket, peerObj]);

  // ✅ Ringtone Logic
  useEffect(() => {
    let ringtoneAudio = null;

    if (!callAccepted) {
      if (incomingCall && incomingCall.type === "audio") {
        ringtoneAudio = new Audio("/sounds/incoming-ring.mp3");
      } else if (!incomingCall) {
        ringtoneAudio = new Audio("/sounds/outgoing-ring.mp3");
      }

      if (ringtoneAudio) {
        ringtoneAudio.loop = true;
        ringtoneAudio.play().catch((err) => console.log("Audio autoplay blocked:", err));
      }
    }

    return () => {
      if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
      }
    };
  }, [callAccepted, incomingCall]);

  // ✅ Timer Logic
  useEffect(() => {
    let interval;
    if (callAccepted) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callAccepted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const handleCallUser = () => {
    // We are initiating the call
    const peer = new Peer({ initiator: true, trickle: false, stream: localStream });
    setPeerObj(peer);
    peerRef.current = peer;

    peer.on("error", (err) => console.log("Peer error:", err));

    // When our peer generates signal data, send it to the other user via socket
    peer.on("signal", (data) => {
      startCall("audio", otherUserId, data);
    });

    // When we receive the other user's stream, play it
    peer.on("stream", (remoteStream) => {
      if(remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
    });
  };

  const handleAnswerCall = () => {
    setCallAccepted(true);
    // We are answering the call
    const peer = new Peer({ initiator: false, trickle: false, stream: localStream });
    setPeerObj(peer);
    peerRef.current = peer;

    peer.on("error", (err) => console.log("Peer error:", err));

    // When our peer generates signal data, send it back to the caller
    peer.on("signal", (data) => {
      answerCall(incomingCall.from, data);
    });

    // When we receive the caller's stream, play it
    peer.on("stream", (remoteStream) => {
      if(remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
    });

    // Feed the caller's signal data into our peer to establish connection
    peer.signal(incomingCall.signalData);
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) peerRef.current.destroy();
    endCall(otherUserId);
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex flex-col items-center justify-center z-[100] backdrop-blur-xl">
      
      {/* Decorative pulsing background */}
      <div className="absolute w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000" style={{ transform: "translate(100px, 100px)" }}></div>

      <audio ref={localAudioRef} autoPlay muted />
      {callAccepted && <audio ref={remoteAudioRef} autoPlay />}

      <div className="relative z-10 flex flex-col items-center mb-20">
        <div className={`w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ${!callAccepted ? 'animate-call-pulse' : ''} mb-6`}>
          <FiPhone className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Audio Call</h2>
        <p className="text-indigo-200 text-lg font-mono">
          {callAccepted ? formatTime(callDuration) : (incomingCall && incomingCall.type === "audio" && !callAccepted ? "Incoming call..." : "Ringing...")}
        </p>
      </div>

      <div className="absolute bottom-12 flex items-center gap-6 bg-white/10 backdrop-blur-lg px-8 py-4 rounded-full border border-white/20">
        
        {/* Mute Button */}
        <button 
          onClick={toggleMute} 
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/80 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
        >
          {isMuted ? <FiMicOff className="w-6 h-6" /> : <FiMic className="w-6 h-6" />}
        </button>

        {/* Start/Answer/End Buttons */}
        {!callAccepted && incomingCall && incomingCall.type === "audio" && (
          <button onClick={handleAnswerCall} className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all animate-bounce">
            <FiPhone className="w-7 h-7 text-white" />
          </button>
        )}
        
        {!callAccepted && !incomingCall && (
          <button onClick={handleCallUser} className="w-16 h-16 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
            <FiPhone className="w-7 h-7 text-white" />
          </button>
        )}
        
        <button onClick={handleEndCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all transform hover:scale-105">
          <FiPhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
};

export default AudioCall;
