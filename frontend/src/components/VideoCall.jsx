import React, { useEffect, useRef, useState, useContext } from "react";
import Peer from "simple-peer";
import { SocketContext } from "../context/SocketContext";
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo as FiVideoIcon, FiVideoOff } from "react-icons/fi";

const VideoCall = ({ currentUserId, otherUserId, onClose }) => {
  const { socket, incomingCall, answerCall, startCall, endCall } = useContext(SocketContext);
  const [callAccepted, setCallAccepted] = useState(false);
  const [peerObj, setPeerObj] = useState(null);
  const peerRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  
  // States for toggling mic/camera
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const streamRef = useRef(null);

  // Get camera + mic stream ONLY if we are the caller, otherwise wait until Answer is clicked
  useEffect(() => {
    if (!incomingCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream);
          streamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Error accessing camera/microphone:", err));
    }

    return () => {
      // Cleanup tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
      if (incomingCall && incomingCall.type === "video") {
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

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
      setIsVideoOff(!localStream.getVideoTracks()[0].enabled);
    }
  };

  const handleCallUser = () => {
    const peer = new Peer({ initiator: true, trickle: false, stream: localStream });
    setPeerObj(peer);
    peerRef.current = peer;

    peer.on("error", (err) => console.log("Peer error:", err));

    peer.on("signal", (data) => {
      startCall("video", otherUserId, data);
    });

    peer.on("stream", (remoteStream) => {
      if(remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });
  };

  const handleAnswerCall = async () => {
    setCallAccepted(true);

    let currentStream = localStream;
    
    // If we are answering, we haven't requested the camera/mic yet
    if (!currentStream) {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(currentStream);
        streamRef.current = currentStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = currentStream;
      } catch (err) {
        console.error("Error accessing camera/microphone on answer:", err);
        return;
      }
    }

    const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
    setPeerObj(peer);
    peerRef.current = peer;

    peer.on("error", (err) => console.log("Peer error:", err));

    peer.on("signal", (data) => {
      answerCall(incomingCall.from, data);
    });

    peer.on("stream", (remoteStream) => {
      if(remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });

    peer.signal(incomingCall.signalData);
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) peerRef.current.destroy();
    endCall(otherUserId);
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-900 flex flex-col items-center justify-center z-[100] overflow-hidden">
      
      {/* Remote Video (Full Screen Background) */}
      {callAccepted ? (
        <video ref={remoteVideoRef} autoPlay className="absolute top-0 left-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-6 animate-pulse shadow-lg">
             <FiVideoIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Video Call</h2>
          <p className="text-gray-400 text-lg">
            {incomingCall && incomingCall.type === "video" ? "Incoming video call..." : "Calling..."}
          </p>
        </div>
      )}

      {/* Call Timer Overlay */}
      {callAccepted && (
        <div className="absolute top-8 right-8 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 z-50 shadow-lg">
          <p className="text-white font-mono text-lg">{formatTime(callDuration)}</p>
        </div>
      )}

      {/* Local Video (Picture-in-Picture) */}
      <div className={`absolute transition-all duration-500 ease-in-out ${callAccepted ? 'bottom-28 right-6 w-32 h-48 md:w-48 md:h-64 shadow-2xl rounded-xl border-2 border-white/20' : 'w-full h-full opacity-0'}`}>
        <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-cover ${callAccepted ? 'rounded-xl' : ''}`} />
        {isVideoOff && callAccepted && (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-800 rounded-xl flex items-center justify-center">
             <FiVideoOff className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-8 flex items-center gap-6 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 shadow-2xl">
        
        {/* Mute Button */}
        <button 
          onClick={toggleMute} 
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/90 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
        >
          {isMuted ? <FiMicOff className="w-5 h-5 md:w-6 md:h-6" /> : <FiMic className="w-5 h-5 md:w-6 md:h-6" />}
        </button>

        {/* Video Off Button */}
        <button 
          onClick={toggleVideo} 
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/90 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
        >
          {isVideoOff ? <FiVideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <FiVideoIcon className="w-5 h-5 md:w-6 md:h-6" />}
        </button>

        {/* Start/Answer/End Buttons */}
        {!callAccepted && incomingCall && incomingCall.type === "video" && (
          <button onClick={handleAnswerCall} className="w-14 h-14 md:w-16 md:h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all animate-bounce">
            <FiPhone className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
        )}
        
        {!callAccepted && !incomingCall && (
          <button onClick={handleCallUser} className="w-14 h-14 md:w-16 md:h-16 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
            <FiPhone className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
        )}
        
        <button onClick={handleEndCall} className="w-14 h-14 md:w-16 md:h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all transform hover:scale-105">
          <FiPhoneOff className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
