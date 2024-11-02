import { User } from "../models/user.model";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import jwt from "jsonwebtoken"
import mongoose, { isValidObjectId } from "mongoose"


const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = []

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "idvalid userId")
  }

  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User Not available witht this userId!");
  }

  if (userId) {
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    })
  }

  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }
    })
  }

  if (sortBy && sortType) {
    const sortTypeValue = sortType === 'desc' ? -1 : 1;

    pipeline.push({
      $sort: { [sortBy]: sortTypeValue }
    })
  }

  pipeline.push({
    $lookup: {
      from: "users",
      localField: 'owner',
      foreignField: '_id',
      as: "owner",
      pipeline: [
        {
          $project: {
            username: 1,
            fullname: 1,
            avatar: 1,
          }
        }
      ]
    }
  })

  pipeline.push({
    $addFields: {
      owner: {
        $first: '$owner'
      }
    }
  })

  const aggregate = Video.aggregate(pipeline)

  Video.aggregatePaginate(aggregate, { page, limit })
    .then(function (result) {
      return res.status(200).json(new ApiResponse(
        200,
        { result },
        "Fetched videos successfully"
      ))
    })
    .catch(function (error) {
      throw error
    })
})

const publishVideo = asyncHandler(async () => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "title or description are required")
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;

  const thumbnailLocalPath = req.files?.thumbnailFile[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) throw new ApiError(400, 'thumbnail and videoLocalPath are required')

  const video = await uploadOnCloudinary(videoLocalPath)

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if (!thumbnail || !video)
    throw new ApiError(400, "Unable to publish video")

  const videos = await Video.create({
    title,
    description: description || '',
    thumbnail: thumbnail.url,
    video: video.url,
    duration: video.duration,

  })

  video.owner = req.user?._id
  await video.save({ validateBeforeSave: false })

  if (!video)
    throw new ApiError(400, "video not uploaded")
  return res.status(200).json(new ApiResponse(200, video, "Video published successfully"))
})

