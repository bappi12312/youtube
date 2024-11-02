import { Playlist } from "../models/playlist.model";
import { User } from "../models/user.model";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
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
