import express from 'express'
import authUser from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import { cancelFollowRequest, discoverPeople, getUserConnections, handleFollowRequest, sendFollowRequest, unfollowUser, getFriendConnections } from '../controllers/connectionController.js'

const connRouter = express.Router()

connRouter.get('/discover-people',authUser,discoverPeople)
connRouter.get('/all-conn',authUser,getUserConnections)
connRouter.get('/friend-conn/:friendId',authUser,getFriendConnections)
connRouter.post('/follow',authUser,sendFollowRequest)
connRouter.post('/handle-follow',authUser,handleFollowRequest)
connRouter.post('/unfollow',authUser,unfollowUser)
connRouter.post('/cancel-follow',authUser,cancelFollowRequest)

export default connRouter