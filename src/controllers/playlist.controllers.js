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
