import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model";
import { User } from "../models/user.model";


const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId
  })

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed._id)

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "Unsubscribed successfully"
        )
      );
  }
  const subscribing = await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  })

  if (!subscribing) {
    throw new ApiError(500, "Server error while subscribing");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully")
    );
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Not found channel id");
  }

  const channel = await User.findById(channelId)

  const subscriberList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 }
      }
    }
  ])

  if (!subscriberList || subscriberList.length === 0) {
    throw new ApiError(404, "Subscriberes not founded");
  }

  res.status(200).json(
    new ApiResponse(200, subscriberList, "Successfully got the subscribers")
  )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, "Not found subscriber id");
  }

  const user = await User.findById(subscriberId)
  if (!user) {
    throw new ApiError(404, "Channel does not exits");
  }

  const subscribedList = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId)
      }
    }, {
      $group: {
        _id: null,
        totalCount: {
          $sum: 1
        }
      }
    }
  ])

  if (!subscribedList || subscribedList.length === 0) {
    throw new ApiError(404, "Subscriberes not founded");
  }

  res.status(200).json(
    new ApiResponse(200, subscribedList, "Successfully got the subscribers")
  )
})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}
