import { Playlist } from "../models/playlist.model";
import { User } from "../models/user.model";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose, { isValidObjectId } from "mongoose"

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "Name or description is not available")
  }

  const playlist = await Playlist.create({
    name,
    description: description || "",
    owner: req.user?._id,
  })

  if (!playlist) {
    throw new ApiError(500, "Playlist is not created")
  }

  return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist Created Successfully"))
})

const getUserPlaylist = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId!");
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: 'videos',
        localField: "videos",
        foreignField: "_id",
        as: 'videos',
        pipeline: [
          {
            $sort: { createdAt: -1 }
          },
          { $limit: 1 },
          {
            $project: {
              thumbnail: 1,
            }
          }
        ]
      }
    },
    {
      $addFields: {
        playlistThumbnail: {
          $cond: {
            if: { $isArray: "$videos" },
            then: { $first: "$videos.thumbnail" },
            else: null,
          }
        },
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        playlistThumbnail: 1
      }
    }
  ])


  return res.status(200).json(new ApiResponse(
    200,
    { playlists },
    "Playlists fetched successfully"
  ));
})

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "invalid playlist id")
  const playlist = await Playlist.findById(playlistId)
  if (!playlist)
    throw new ApiError(404, "Playlist not found")
  return res.status(200)
    .json(new ApiResponse(200, playlist, "playlist id found successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, VideoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "playlist id or video id is not valid")
  }

  const playlist = await Playlist.findById(playlistId)
  if (!playlist)
    throw new ApiError(404, "playlist not found")

  const video = await Video.findById(videoId)

  if (!video || !video.isPublished)
    throw new ApiError(404, "video not found")

  playlist.videos.push(videoId)

  const updatedPlaylist = await playlist.save()

  if (!updatedPlaylist)
    throw new ApiError(500, "playlist not updated")

  return res.status(200)
    .json(new ApiResponse(200, updatedPlaylist, "video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlist id or video id")
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist)
    throw new ApiError(404, "Playlist not found")

  const video = await Video.findById(videoId)
  if (!video || !isPublished(video))
    throw new ApiError(404, "video not found")

  playlist.videos.pull(videoId)
  const updatedPlaylist = await Playlist.save({ validateBeforeSave: false })

  if (!updatedPlaylist)
    throw new ApiError(400, "Playlist could not be updated")

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  if (!isValidObjectId(playlistId))
      throw new ApiError(400, "Playlistid is not valid")
  const playlistDeleted = await Playlist.findByIdAndDelete(playlistId);
  if (!playlistDeleted)
      throw new ApiError(404, "Playlist not deleted")

  return res.status(200)
      .json(new ApiResponse(200, playlistDeleted, "Successfully deleted playlist"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body
  if (!isValidObjectId(playlistId))
      throw new ApiError(400, "invalid playlist id")
  if (!name || !description)
      throw new ApiError(400, "name or description is required")
  const playlistUpdated = await Playlist.findByIdAndUpdate(playlistId,
      {
          $set: {
              name,
              description
          }
      },
      {
          new: true
      }
  )
  if (!playlistUpdated)
      throw new ApiError(400, "Playlist not updated")
  return res.status(200)
      .json(new ApiResponse(200, playlistUpdated, "Playlist updated successfully"))
})

export {
  createPlaylist,
  getUserPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
}
