import express from 'express'
import authUser from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import { createPost, deletePost, editPost, getAllPostsByfriend, getAllPostsByMe, getFeedPosts, getPostSharers, getSinglePost, likePost, sharePost} from '../controllers/postController.js'
import { postCreationLimiter } from '../middleware/rateLimiter.js'

const postRouter = express.Router()

postRouter.post('/create-post', authUser, postCreationLimiter, upload.single("media"), createPost)
postRouter.get('/posts',authUser,getFeedPosts)
postRouter.get('/get-post-by-me',authUser,getAllPostsByMe)
postRouter.get('/get-post-by-friend/:friendId',authUser,getAllPostsByfriend)
postRouter.post('/delete-post',authUser,deletePost)
postRouter.put('/edit-post',authUser,editPost)
postRouter.post('/:postId/like',authUser,likePost) 
postRouter.get("/:postId", authUser, getSinglePost);
postRouter.post("/:postId/share", authUser, sharePost);
postRouter.get("/:postId/shares", authUser, getPostSharers);

export default postRouter