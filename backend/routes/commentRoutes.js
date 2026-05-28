import express from 'express'
import authUser from '../middleware/auth.js'
import upload from '../middleware/multer.js' 
import { addComment, deleteComment, getPostComments, likeComment } from '../controllers/commentController.js'

const commentRouter = express.Router()

commentRouter.post('/add', authUser, addComment)
commentRouter.get('/get/:postId', authUser, getPostComments)
commentRouter.delete('/delete/:commentId', authUser, deleteComment)
commentRouter.post('/like/:commentId', authUser, likeComment)


export default commentRouter