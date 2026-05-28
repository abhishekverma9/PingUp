import axios from "axios";
import { createContext, useEffect, useState,useRef } from "react";
import { toast } from "react-toastify";

export const AuthContext = createContext();

// ✅ axios instance with baseURL + cookies
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const api = axios.create({
    baseURL: backendUrl,
    withCredentials: true, // send/receive cookies (refresh token)
});

const AuthContextProvider = (props) => {
    // access token is now ONLY in memory
    const [token, setToken] = useState("");
    const tokenRef = useRef(token);
    const [authChecked, setAuthChecked] = useState(false)
    const [profileData, setProfileData] = useState({});
    const [friendProfile, setFriendProfile] = useState({});
    const [posts, setPosts] = useState([]);
    const [postsByMe, setPostsByMe] = useState([]);
    const [postsByFriend, setPostsByFriend] = useState([]);
    const [discoverPeople, setDiscoverPeople] = useState([]);
    const [stories, setStories] = useState([]);
    const [users, setUsers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [connections, setConnections] = useState({
        followers: [],
        following: [],
        pending: [],
    });

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    const dateFormat = (date) => {
        if (!date) return "";

        const datee = new Date(date);
        const day = String(datee.getDate()).padStart(2, "0");
        const month = months[datee.getMonth()];
        const year = datee.getFullYear();

        let hours = datee.getHours();
        const minutes = String(datee.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;

        return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    };

    const timeAgo = (date) => {
        if (!date) return "";

        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const monthsDiff = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years > 0) return years === 1 ? "1 year ago" : `${years} years ago`;
        if (monthsDiff > 0)
            return monthsDiff === 1 ? "1 month ago" : `${monthsDiff} months ago`;
        if (days > 0) return days === 1 ? "1 day ago" : `${days} days ago`;
        if (hours > 0) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
        if (minutes > 0)
            return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
        return seconds <= 1 ? "just now" : `${seconds} seconds ago`;
    };
    useEffect(() => {
        tokenRef.current = token;
    }, [token]);
    // ✅ Attach interceptors once, and re-attach when token changes
    useEffect(() => {
        const reqInterceptor = api.interceptors.request.use((config) => {
            // Always grab the latest token from the ref, bypassing React state delays!
            if (tokenRef.current) {
                config.headers.Authorization = `Bearer ${tokenRef.current}`;
            }
            return config;
        }, (error) => Promise.reject(error));

        const resInterceptor = api.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            if (!error.response || !originalRequest) return Promise.reject(error);

            const isRefreshCall = originalRequest.url?.includes("/api/user/refresh");
            if (isRefreshCall) {
                setToken("");
                return Promise.reject(error);
            }

            if (error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const refreshRes = await api.post("/api/user/refresh");
                    if (refreshRes.data.success) {
                        const newToken = refreshRes.data.accessToken;
                        setToken(newToken); // Update state
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    } else {
                        setToken("");
                    }
                } catch (refreshErr) {
                    setToken("");
                    return Promise.reject(refreshErr);
                }
            }
            return Promise.reject(error);
        });

        return () => {
            api.interceptors.request.eject(reqInterceptor);
            api.interceptors.response.eject(resInterceptor);
        };
    }, []);

    // 🔁 Optional: try to get token on first load using refresh cookie
    useEffect(() => {
        const tryRefreshOnLoad = async () => {
            try {
                const res = await api.post("/api/user/refresh");
                if (res.data.success) {
                    setToken(res.data.accessToken);
                } else {
                    setToken("");
                }
            } catch (err) {
                setToken("");
            } finally {
                setAuthChecked(true);   // 👈 mark that we finished checking
            }
        };
        tryRefreshOnLoad();
    }, []);


    // ================
    //  API FUNCTIONS
    // ================
    const logout = async () => {
        try {
            await api.post("/api/user/logout"); // backend clears refresh cookie + DB token
        } catch (error) {
            toast.error(error.message);
        } finally {
            setToken(""); // clear in-memory access token
        }
    };

    const getProfileData = async () => {
        try {
            const { data } = await api.get("/api/user/get-profiledata");
            if (data.success) {
                setProfileData(data.profileData);
                console.log(data.profileData);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getFriendProfileData = async (friendId) => {
        try {
            const { data } = await api.get(`/api/user/friendprofiledata/${friendId}`);
            if (data.success) {
                setFriendProfile(data.profileData);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getPostsByMe = async () => {
        try {
            const { data } = await api.get("/api/post/get-post-by-me");
            if (data.success) {
                setPostsByMe(data.posts);
                getProfileData();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getPostsByFriend = async (friendId) => {
        try {
            const { data } = await api.get(`/api/post/get-post-by-friend/${friendId}`);
            if (data.success) {
                setPostsByFriend(data.posts);
                // If you want friend profile for this friend:
                // getFriendProfileData(friendId);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const deletePost = async (postId) => {
        try {
            const { data } = await api.post("/api/post/delete-post", { postId });
            if (data.success) {
                toast.success(data.message);
                getPostsByMe();
                fetchFeedPosts();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchAllConnection = async (search = "") => {
        try {
            const { data } = await api.get(`/api/conn/all-conn?search=${encodeURIComponent(search)}`);
            if (data.success) {
                setConnections(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchFriendConnections = async (friendId) => {
        try {
            const { data } = await api.get(`/api/conn/friend-conn/${friendId}`);
            if (data.success) {
                return data.data;
            } else {
                toast.error(data.message);
                return { followers: [], following: [] };
            }
        } catch (error) {
            toast.error(error.message);
            return { followers: [], following: [] };
        }
    };

    const sendFollowRequest = async (friendId) => {
        try {
            const { data } = await api.post("/api/conn/follow", { friendId });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const cancelFollowRequest = async (friendId) => {
        try {
            const { data } = await api.post("/api/conn/cancel-follow", { friendId });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleFollowAction = async (requesterId, action) => {
        try {
            const { data } = await api.post("/api/conn/handle-follow", {
                requesterId,
                action,
            });
            if (data.success) {
                toast.success(data.message);
                fetchAllConnection();
                getFriendProfileData(requesterId);
                getProfileData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
    const unfollowUser = async (friendId) => {
        try {
            const { data } = await api.post("/api/conn/unfollow", { friendId });
            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };
    const fetchFeedPosts = async () => {
        try {
            const { data } = await api.get("/api/post/posts");
            if (data.success) {
                setPosts(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
    const fetchDiscoverPeople = async (search = "") => {
        try {
            const { data } = await api.get(`/api/conn/discover-people?search=${encodeURIComponent(search)}`);
            if (data.success) {
                setDiscoverPeople(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchAllStories = async () => {
        try {
            const { data } = await api.get("/api/story/all");
            if (data.success) {
                setStories(data.allstories);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteStory = async (storyId) => {
        try {
            const { data } = await api.delete(`/api/story/${storyId}`);
            if (data.success) {
                toast.success(data.message);
                fetchAllStories();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const openViewersList = async (storyId) => {
        try {
            // implement when needed
        } catch (error) {
            toast.error(error.message);
        }
    };

    const markViewed = async (storyId) => {
        try {
            await api.post(`/api/story/${storyId}/view`, {});
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchViewers = async (storyId) => {
        try {
            const { data } = await api.get(`/api/story/${storyId}/viewers`);
            if (data.success) {
                return data.viewers;
            } else {
                toast.error(data.message);
                return [];
            }
        } catch (error) {
            toast.error(error.message);
            return [];
        }
    };

    const handleLikeStory = async (storyId, isCurrentlyLiked, setLiked) => {
        try {
            const { data } = await api.post(`/api/story/${storyId}/like`, {});
            if (data.success) {
                toast.success(data.message);
                setLiked(!isCurrentlyLiked);
                fetchAllStories();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleStoryComment = async (storyId, text, setComment) => {
        try {
            const { data } = await api.post(`/api/story/${storyId}/comment`, { text });
            if (data.success) {
                toast.success(data.message);
                setComment("");
                fetchAllStories();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handlePostLike = async (postId, liked, setLiked, setLikesCount) => {
        try {
            const { data } = await api.post(`/api/post/${postId}/like`, {});
            if (data.success) {
                toast.success(data.message);
                setLikesCount(data.likesCount);
                setLiked(!liked);
                fetchFeedPosts();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const { data } = await api.get("/api/user/all");
            if (data.success) {
                setUsers(data.users);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
    const fetchSessions = async () => {
        try {
            const { data } = await api.get("/api/user/sessions");
            if (data.success) {
                setSessions(data.sessions);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    // When token changes (login / refresh), load all data
    useEffect(() => {
        if (token) {
            getProfileData();
            getPostsByMe();
            fetchAllConnection();
            fetchFeedPosts();
            fetchDiscoverPeople();
            fetchAllStories();
            fetchAllUsers();
            fetchSessions();
        }
    }, [token]);

    // Just debug
    useEffect(() => {
        console.log(profileData);
    }, [profileData]);

    const value = {
        token,          // this is your accessToken now (in memory)
        setToken,       // call this after login with backend accessToken
        backendUrl,
        api, logout, authChecked,         // in case you want raw access elsewhere
        getProfileData, unfollowUser,
        setProfileData,
        profileData,
        dateFormat,
        timeAgo,
        getPostsByMe,
        postsByMe,
        deletePost,
        getFriendProfileData,
        friendProfile,
        setFriendProfile,
        getPostsByFriend,
        postsByFriend,
        sendFollowRequest,
        cancelFollowRequest,
        connections,
        handleFollowAction,
        fetchFeedPosts,
        posts,
        discoverPeople,
        stories,
        fetchAllStories,
        handleDeleteStory,
        openViewersList,
        markViewed,
        fetchViewers,
        handleLikeStory,
        handleStoryComment,
        handlePostLike,
        fetchAllUsers, fetchSessions, sessions,
        users,
        fetchFriendConnections,
        fetchDiscoverPeople,
        fetchAllConnection,
    };

    return (
        <AuthContext.Provider value={value}>
            {props.children}
        </AuthContext.Provider>
    );
};

export default AuthContextProvider;
