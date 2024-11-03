import { parse } from "dotenv";
import { Playlist } from "../models/playlist.model";
import { User } from "../models/user.model";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comments.model";
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video Id")

  const video = await Video.findById(videoId)
  if (!video)
    throw new ApiError(404, "Video not found")

  const parsedLimit = parseInt(limit)
  const pageSkip = (page - 1) * parsedLimit

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: "owner",
        foreignField: "_id",
        as: 'owner',
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1
            }
          }
        ]
      }
    },
    {
      $skip: pageSkip
    },
    {
      $limit: parsedLimit
    }
  ])

  if (!comments || comments.length === 0) {
    throw new ApiError(404, "Comments not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments found successfully"))
})

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Invalid video id")

  if (!content)
    throw new ApiError(400, "content is required")

  const videoFound = await Video.findById(videoId)

  if (!videoFound)
    throw new ApiError(404, "Video not found")

  const comments = await Comment.create({
    content,
    owner: req.user?._id,
    video: videoFound?._id,
  })

  if (!comments) {
    throw new ApiError(400, "Could not create comment")
  }
  return res.status(200).json(new ApiResponse(200, comments, "comment created successfully"))
})