import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comments.model";
import { Likes } from "../models/likes.model";
import { Tweet } from "../models/tweet.model";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Invalid video id")

  try {
    const video = await Video.findById(videoId)
    if (!video || (video.owner.toString() !== req.user?._id.toString())) throw new ApiError(404, "video not found")

    const likeCritaria = {
      video: videoId,
      likedBy: req.user?._id
    }

    const alreadyLiked = await Likes.findOne(likeCritaria)

    if (!alreadyLiked) {
      const newLike = await Likes.create(likeCritaria)

      if (!newLike)
        throw new ApiError(400, "could not add new like")

      return res
        .status(200)
        .json(new ApiResponse(200, newLike, "toggled successfully"))
    }

    const dislike = await Likes.deleteOne(likeCritaria)

    if (!dislike)
      throw new ApiError(400, "unable to dislike")

    return res.status(200).json(new ApiResponse(200, dislike, "Video disliked successfully"))
  } catch (error) {
    throw new ApiError(500, error?.message || "some error occured while toggling")
  }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid comment id")

  const commentFound = await Comment.findById(commentId)
  if (!commentFound || (commentFound.owner.toString() !== req.user?._id.toString()) && commentFound.length !== 0) throw new ApiError(404, "Comment not found")
  const likeCritaria = {
    comment: commentId,
    likedBy: req.user?._id
  }

  const alreadyLiked = await Likes.findOne(likeCritaria)
  if (!alreadyLiked) {
    const newLike = await Likes.create(likeCritaria)


    if (!newLike)
      throw new ApiError(400, "unable to like")

    return res
      .status(200)
      .json(new ApiResponse(200, newLike, "new comment liked successfully"))
  }

  const dislike = await Likes.deleteOne(likeCritaria)

  if (!dislike) {
    throw new ApiError(400, "unable to dislike")

  }

  return res
    .status(200)
    .json(new ApiResponse(200, dislike, "comment disliked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId))
    throw new ApiError(400, "invalid tweet id")

  const tweet = await Tweet.findById(tweetId)
  if (!tweet || (tweet.owner?.toString() !== req.user?._id.toString()))
    throw new ApiError(404, "tweet not found")

  const likeCritaria = {
    tweet: tweetId,
    likedBy: req.user?._id
  }
  const alreadyLiked = await Likes.findOne(likeCritaria)

  if (!alreadyLiked) {
    const newlike = await Likes.create(likeCriteria)
    if (!newlike)
      throw new ApiError(400, "unable to like")

    return res
      .status(200)
      .json(new ApiResponse(200, newlike, "tweet liked successfully"))
  }

  const dislike = await Likes.deleteOne(likeCritaria)


  if (!dislike)
    throw new ApiError(400, "unable to dislike")

  return res.status(200).json(new ApiResponse(200, dislike, "tweet disliked successfully"))
})