import express from 'express'
import { allUsers, forgotPassword, getFriendProfileData, getProfileData, getSessions, googleLogin, loginUser, logoutAllDevices, logoutUser, refreshAccessToken, registerUser, resetPassword, revokeSession, updatePassword, updateProfileData } from '../controllers/userController.js'
import authUser from '../middleware/auth.js'
import upload from '../middleware/multer.js'


const userRouter = express.Router()

userRouter.post('/google-login', googleLogin);
userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)

userRouter.post("/refresh", refreshAccessToken);
userRouter.post("/logout", logoutUser);

userRouter.post('/forgot-password', forgotPassword);
userRouter.patch('/reset-password/:token', resetPassword);
//Session Revocation
userRouter.post("/revoke-sessions", authUser, logoutAllDevices);
userRouter.delete("/sessions/:sessionId", authUser, revokeSession);
userRouter.get("/sessions", authUser,getSessions)

userRouter.get('/all',authUser,allUsers)
userRouter.get('/get-profiledata',authUser,getProfileData)
userRouter.post('/update-password',authUser,updatePassword)
userRouter.get('/friendprofiledata/:friendId',authUser,getFriendProfileData)
userRouter.post('/update-profiledata',authUser,upload.fields([{name:"profile",maxCount:1},{name:"cover",maxCount:1}]),updateProfileData)

export default userRouter