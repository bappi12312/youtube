import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model";
import { Tweet } from "../models/tweet.model";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content)
    throw new ApiError(400, "content is required")

  const newTweet = await Tweet.create({
    content,
    owner: req.user?._id
  })

  if (!newTweet)
    throw new ApiError(400, "Tweet not created")

  return res.status(200).json(new ApiResponse(200, newTweet, "Tweet created successfully"))
})