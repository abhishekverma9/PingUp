import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import PostCard from '../components/PostCard';
const SinglePost = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { api ,profileData} = useContext(AuthContext);

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const { data } = await api.get(`/api/post/${postId}`);
                if (data.success) {
                    setPost(data.post);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error("Failed to load post");
            } finally {
                setLoading(false);
            }
        };

        if (postId) fetchPost();
    }, [postId, api]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen text-gray-500 dark:text-gray-400">Loading post...</div>;
    }

    if (!post) {
        return <div className="flex justify-center items-center min-h-screen text-gray-500 dark:text-gray-400">Post not found or deleted.</div>;
    }
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full flex justify-center font-sans transition-colors duration-200">
            <div className="w-full max-w-2xl p-4 sm:p-6 lg:p-8 pb-20">
                {/* Header */}
                <div className="w-full flex items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition mr-4 border border-gray-200 dark:border-gray-600"
                    >
                        <FiArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-wide">Post</h1>
                </div>

                {/* Post Content */}
                <div className="w-full animate-fadeIn">
                    <PostCard post={post} user={profileData} />
                </div>
            </div>
        </div>
    );
};

export default SinglePost;