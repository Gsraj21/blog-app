const expressAsyncHandler = require("express-async-handler");
const Comment = require("../../model/comment/Comment");
const validateMongodbId = require("../../utils/validateMongodbID");
const isBlockedUser = require("../../utils/isBlock");


const createCommentCtrl = expressAsyncHandler(async (req, res) => {
  const user = req.user;
  //console.log(req.user);
  isBlockedUser(user);
  const { postId, description } = req.body;
  // console.log(postId, description);

  try {
    const comment = await Comment.create({
      post: postId,
      user,
      description,
    });
    // console.log(comment);
    res.json(comment);
  } catch (error) {
    res.json(error);
  }
});

const fetchAllCommentsCtrl = expressAsyncHandler(async (req, res) => {
  try {
    const comments = await Comment.find({}).sort("-created");
    res.json(comments);
  } catch (error) {
    res.json(error);
  }
});

const fetchCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
 

  try {
    const comment = await Comment.findById(id);
    res.json(comment);
  } catch (error) {
    res.json(error);
  }
});

// update a comment

const updateCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);


  try {
    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      {
        user: req.user,
        description: req.body.description,
      },
      { new: true, runValidators: true }
    );

    res.json(updatedComment);
  } catch (error) {
    res.json(error);
  }
});

const deleteCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const deletedComment = await Comment.findByIdAndDelete(id);
    res.json(deletedComment);
  } catch (error) {
    res.json(error);
  }
});
module.exports = {
  createCommentCtrl,
  fetchAllCommentsCtrl,
  fetchCommentCtrl,
  updateCommentCtrl,
  deleteCommentCtrl
};
