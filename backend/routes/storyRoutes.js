import express from 'express'
import authUser from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import { addComment, createStory, deleteStory, getComments, getStories, getStoryLikes, getViewers, markStoryViewed, toggleLikeStory } from '../controllers/storyController.js'


const storyRouter = express.Router()

storyRouter.post('/create',authUser,upload.single("file"),createStory)
storyRouter.get('/all',authUser,getStories)
storyRouter.delete('/:storyId',authUser,deleteStory)

// Likes
storyRouter.post("/:storyId/like", authUser, toggleLikeStory);
storyRouter.get("/:storyId/likes",authUser, getStoryLikes);

// Comments
storyRouter.post("/:storyId/comment", authUser, addComment);
storyRouter.get("/:storyId/comments",authUser, getComments);

// Viewers
storyRouter.post('/:storyId/view',authUser,markStoryViewed)
storyRouter.get("/:storyId/viewers",authUser, getViewers);

export default storyRouter