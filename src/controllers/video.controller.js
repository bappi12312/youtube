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

const publishVideo = asyncHandler(async (req, res) => {
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

const getSingleVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video id required")
  }
  const video = await Video.findById(videoId)

  if (!video)
    throw new ApiError(404, "video not found")

  return res.status(200).json(new ApiResponse(200, video, "video found successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "videoId not valid")

  const video = await Video.findById(videoId)

  if (!video && !(toString(video.owner) === toString(req.user?._id))) {
    throw new ApiError(402, "video noto found")
  }

  if (!title || !description)
    throw new ApiError(400, "title or description required")

  // const thumbnailLocalPath = req.file?.path;
  const thumbnailLocalPath = req.files.thumbnail[0].path;

  if (!thumbnailLocalPath)
    throw new ApiError(400, "thumbnail not found")

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if (!thumbnail)
    throw new ApiError(400, "thumbnail not uploaded")


  const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail?.url,
      }
    },
    { new: true }
  )

  if (!updateVideo)
    throw new ApiError(400, "video not updated")

  return res.status(200).json(new ApiResponse(200, updateVideo, "video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;


  if (!isValidObjectId(videoId))
    throw new ApiError(400, "video id is required")

  const deleteVideo = await Video.findByIdAndDelete(videoId)

  if (!deleteVideo)
    throw new ApiError(400, "video not deleted")
  return res.status(200).json(new ApiResponse(200, deleteVideo, "Video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId))
    throw new ApiError(400, "video id is required")

  const video = await Video.findById(videoId)

  if (!video && !toString(video.owner) === toString(req.user?._id))
    throw new ApiError(404, "Video not found")

  const isPublished = !video.isPublished
  const togglepublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: isPublished,
      }
    },
    { new: true }
  )

  if (!togglepublish)
    throw new ApiError(400, "video toggled went wrong")

  return res.status(200).json(new ApiResponse(200, togglepublish, "Video toggled successfully"))
})

export {
  getAllVideos,
  publishVideo,
  getSingleVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}


