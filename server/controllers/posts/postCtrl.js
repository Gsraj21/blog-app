const Post = require("../../model/post/Post");
const expressAsyncHandler = require("express-async-handler");
const validateMongodbId = require("../../utils/validateMongodbID");
const Filter = require("bad-words");
const User = require("../../model/user/User");
const cloudinaryUploadImg = require("../../utils/cloudinary");
const fs = require("fs");
const isBlockedUser = require("../../utils/isBlock");

//******** check the post routes again and also be careful on the like and dislike add to the post ctrl */

const createPostCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;
  isBlockedUser(req.user);
  validateMongodbId(_id);
  //Check for bad words
  const filter = new Filter();
  const isProfane = filter.isProfane(req.body.title, req.body.description);
  //Block user
  if (isProfane) {
    await User.findByIdAndUpdate(_id, {
      isBlocked: true,
    });
    throw new Error(
      "Creating Failed because it contains profane words and you have been blocked"
    );
  }

  // prevent user from creating post if he hast starter account
console.log(req?.user?.postCount);
  if(req?.user?.accountType === "Starter Account"  && req?.user?.postCount >= 2) throw new Error (`OOPS! you have a starter Account , try to gain more followers first`)

  const localPath = `public/images/posts/${req.file.filename}`;

  //upload to the cloudinary

  const imgUploaded = await cloudinaryUploadImg(localPath);

  try {
    const post = await Post.create({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      image: imgUploaded?.url,
      user: _id,
    });

    // update the post count
    await User.findByIdAndUpdate(
      _id,
      {
        $inc: { postCount: 1 },
      },
      { new: true }
    );

    // remove the photos
    fs.unlinkSync(localPath);
    res.json(post);
  } catch (error) {
    //console.log("this is error in post create",error);
    res.json(error.message);
  }
});

const fetchPostsCtrl = expressAsyncHandler(async (req, res) => {
  const hasCategory = req.query.category;
  try {
    if (hasCategory) {
      const posts = await Post.find({ category: hasCategory })
        .populate("user")
        .populate("comments")
        .sort("-createdAt");
      res.json(posts);
    } else {
      const posts = await Post.find({})
        .populate("user")
        .populate("comments")
        .sort("-createdAt");
      res.json(posts);
    }
  } catch (error) {
    res.json(error);
  }
});

const fetchPostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const post = await Post.findById(id).populate("user").populate("comments");

  await Post.findByIdAndUpdate(
    id,
    {
      $inc: { numViews: 1 },
    },
    { new: true }
  );

  res.json(post);
});

// update post

const updatePostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        ...req.body,
        user: req.user?._id,
      },
      { new: true }
    );

    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

const deletePostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    // here i can user fineone and delete also but it is not working now
    const post = await Post.findByIdAndDelete(id);
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

const toggleAddLikeCtrl = expressAsyncHandler(async (req, res) => {
  //get the post id
  const { postId } = req.body;
  // find that post
  const post = await Post.findById(postId);

  //find the login user
  const loginUserId = req.user?._id;

  //check if user have liked the post
  const isLiked = post?.isLiked;

  // check if user have disliked the post

  const alreadyDisliked = post?.disLikes?.find(
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  if (alreadyDisliked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
        isDisliked: false,
      },
      { new: true }
    );
    res.send(post);
  }

  // remove the user if he has liked it
  if (isLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true }
    );

    res.send(post);
  } else {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loginUserId },
        isLiked: true,
      },
      { new: true }
    );
    res.json(post);
  }
});

//dislikes controller

const toggleAddDislikeCtrl = expressAsyncHandler(async (req, res) => {
  //1.Find the post to be disLiked
  const { postId } = req.body;
  const post = await Post.findById(postId);
  //2.Find the login user
  const loginUserId = req?.user?._id;
  //3.Check if this user has already disLikes
  const isDisLiked = post?.isDisLiked;
  //4. Check if already like this post
  const alreadyLiked = post?.likes?.find(
    (userId) => userId.toString() === loginUserId?.toString()
  );
  //Remove this user from likes array if it exists
  if (alreadyLiked) {
    const post = await Post.findOneAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true }
    );
    res.json(post);
  }
  //Toggling
  //Remove this user from dislikes if already disliked
  if (isDisLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
        isDisLiked: false,
      },
      { new: true }
    );
    res.json(post);
  } else {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { disLikes: loginUserId },
        isDisLiked: true,
      },
      { new: true }
    );
    res.json(post);
  }
});

module.exports = {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  updatePostCtrl,
  deletePostCtrl,
  toggleAddLikeCtrl,
  toggleAddDislikeCtrl,
};
