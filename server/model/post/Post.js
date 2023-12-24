const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      //required: [true, "title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "category is required"],
    },
    isLiked: {
      type: Boolean,
      default: false,
    },
    isDisLiked: {
        type: Boolean,
        default: false,
      },
    numViews: {
      type: Number,
      default: 0,
    },
    likes:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    disLikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "author is required"],
    },

    description: {
      type: String,
      required: [true, "post description is required"],
    },
    image: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2023/09/24/07/00/mountains-8272227_640.jpg",
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: {
      virtuals: true,
    },
  }
);

postSchema.virtual('comments',{
  ref:"Comment",
  foreignField:'post',
  localField:'_id'
})

const Post = mongoose.model('Post',postSchema);

module.exports = Post;