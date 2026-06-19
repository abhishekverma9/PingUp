import React, { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Connections from './pages/Connections'
import Login from './pages/Login'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import DiscoverPeople from './pages/DiscoverPeople'
import Layout from './components/Layout'
import CreatePostPage from './pages/CreatePost'
import CreateStoryModal from './pages/CreateStory'
import { ToastContainer } from 'react-toastify'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'
import FriendProfilePage from './pages/ProfileFriend'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import SinglePost from './pages/SinglePost'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

const App = () => {
  const { token, authChecked } = useContext(AuthContext)
  if (!authChecked) {
    return (
      <div>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        toastClassName={(context) => 
          `relative flex min-h-10 rounded-xl items-center justify-between overflow-hidden cursor-pointer shadow-2xl mt-4 mx-4 sm:mx-auto max-w-[90vw] sm:max-w-sm border border-gray-200 dark:border-gray-700 backdrop-blur-lg ${
            context?.type === 'error' ? 'bg-red-100 dark:bg-red-900/50' :
            context?.type === 'success' ? 'bg-green-100 dark:bg-green-900/50' :
            'bg-white dark:bg-gray-800'
          }`
        }
        bodyClassName={(context) => `flex-1 break-words whitespace-pre-wrap text-sm font-medium p-3 pl-4 pr-2 ${
          context?.type === 'error' ? 'text-red-800 dark:text-red-200' :
          context?.type === 'success' ? 'text-green-800 dark:text-green-200' :
          'text-gray-800 dark:text-gray-100'
        }`}
        />
        {/* optional loader */}
        {/* <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</p> */}
      </div>
    );
  }
  return (
    <div>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastClassName={(context) => 
          `relative flex min-h-10 rounded-xl items-center justify-between overflow-hidden cursor-pointer shadow-2xl mt-4 mx-4 sm:mx-auto max-w-[90vw] sm:max-w-sm border border-gray-200 dark:border-gray-700 backdrop-blur-lg ${
            context?.type === 'error' ? 'bg-red-100 dark:bg-red-900/50' :
            context?.type === 'success' ? 'bg-green-100 dark:bg-green-900/50' :
            'bg-white dark:bg-gray-800'
          }`
        }
        bodyClassName={(context) => `flex-1 break-words whitespace-pre-wrap text-sm font-medium p-3 pl-4 pr-2 ${
          context?.type === 'error' ? 'text-red-800 dark:text-red-200' :
          context?.type === 'success' ? 'text-green-800 dark:text-green-200' :
          'text-gray-800 dark:text-gray-100'
        }`}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={token ? <Home /> : <Navigate to={'/login'} />} />
          <Route path='/connections' element={token ? <Connections /> : <Navigate to={'/login'} />} />
          <Route path='/login' element={!token ? <Login /> : <Navigate to='/' />} />
          <Route path='/forgot-password' element={!token ? <ForgotPassword /> : <Navigate to='/' />} />
          <Route path='/reset-password/:token' element={!token ? <ResetPassword /> : <Navigate to='/' />} />
          <Route path='/messages' element={token ? <Messages /> : <Navigate to={'/login'} />} />
          <Route path='/profile' element={token ? <Profile /> : <Navigate to={'/login'} />} />
          <Route path='/friendprofile/:friendId' element={token ? <FriendProfilePage /> : <Navigate to={'/login'} />} />
          <Route path='/discover' element={token ? <DiscoverPeople /> : <Navigate to={'/login'} />} />
          <Route path='/create-post' element={token ? <CreatePostPage /> : <Navigate to={'/login'} />} />
          <Route path='/create-story' element={token ? <CreateStoryModal /> : <Navigate to={'/login'} />} />
          <Route path='/notifications' element={token ? <Notifications /> : <Navigate to={'/login'} />} />
          <Route path='/settings' element={token ? <Settings /> : <Navigate to={'/login'} />} />
          <Route path="/post/:postId" element={token ? <SinglePost /> : <Navigate to={'/login'} />} />
          
          {/* Catch-all route for 404 Page Not Found */}
          <Route path="*" element={token ? <NotFound /> : <Navigate to={'/login'} />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
