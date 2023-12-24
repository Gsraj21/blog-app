const expressAsyncHandler = require("express-async-handler");
const generateToken = require("../../config/token/generateToken");
const fs = require("fs");
const crypto = require("crypto");
const User = require("../../model/user/User");
const validateMongodbId = require("../../utils/validateMongodbID");
const mailSender = require("../../utils/MailSender");
const cloudinaryUploadImg = require("../../utils/cloudinary");
const isBlockedUser = require("../../utils/isBlock");

//-------------------------------------
//Register
//-------------------------------------

const userRegisterCtrl = expressAsyncHandler(async (req, res) => {
  //Check if user Exist
  const userExists = await User.findOne({ email: req?.body?.email });

  if (userExists) throw new Error("User already exists");
  try {
    //Register user
    const user = await User.create({
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      password: req?.body?.password,
    });
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

//-------------------------------
//Login user
//-------------------------------

const loginUserCtrl = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  //check if user exists
  const userFound = await User.findOne({ email });
  //Check if password is match
  if (userFound?.isBlocked)
    throw new Error(`Access Denied ${userFound.firstName} is Blocked`);
  if (userFound && (await userFound.isPasswordMatched(password))) {
    res.json({
      _id: userFound?._id,
      firstName: userFound?.firstName,
      lastName: userFound?.lastName,
      email: userFound?.email,
      profilePhoto: userFound?.profilePhoto,
      isAdmin: userFound?.isAdmin,
      token: generateToken(userFound?._id),
      isVerified: userFound?.isAccountVerified,
    });
  } else {
    res.status(401);
    throw new Error("Invalid Login Credentials");
  }
});

//------------------------------
//Users
//-------------------------------
const fetchUsersCtrl = expressAsyncHandler(async (req, res) => {
  console.log(req.headers);
  try {
    const users = await User.find({}).populate("posts");
    res.json(users);
  } catch (error) {
    res.json(error);
  }
});

//------------------------------
//Delete user
//------------------------------
const deleteUsersCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  //check if user id is valid
  validateMongodbId(id);
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    res.json(deletedUser);
  } catch (error) {
    res.json(error);
  }
});

//----------------
//user details
//----------------
const fetchUserDetailsCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  //check if user id is valid
  validateMongodbId(id);
  try {
    const user = await User.findById(id);
    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

//------------------------------
//User profile
//------------------------------

const userProfileCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  //find the login user
  // check this perticular exist in the array or not?
  const loginUserId = req?.user?._id.toString();
  try {
    // this is the concept of virtual populate method
    const myProfile = await User.findById(id)
      .populate("posts")
      .populate("viewedBy");
    const alreadyViewed = myProfile?.viewedBy?.find((user) => {
      return user?._id.toString() === loginUserId;
    });

    if (alreadyViewed) {
      res.json(myProfile);
    } else {
      const profile = await User.findByIdAndUpdate(myProfile?._id, {
        $push: { viewedBy: loginUserId },
      });
      res.json(profile);
    }
  } catch (error) {
    res.json(error);
  }
});

//------------------------------
//Update profile
//------------------------------
const updateUserCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req?.user;
  validateMongodbId(_id);

  const user = await User.findByIdAndUpdate(
    _id,
    {
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      bio: req?.body?.bio,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.json(user);
});

//------------------------------
//Update password
//------------------------------

const updateUserPasswordCtrl = expressAsyncHandler(async (req, res) => {
  //destructure the login user
  const { _id } = req.user;
  const { password } = req.body;
  validateMongodbId(_id);
  //Find the user by _id
  const user = await User.findById(_id);

  if (password) {
    user.password = password;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.json(user);
  }
});

//------------------------------
//following
//------------------------------

const followingUserCtrl = expressAsyncHandler(async (req, res) => {
  //1.Find the user you want to follow and update it's followers field
  //2. Update the login user following field
  const { followId } = req.body;
  const loginUserId = req.user.id;

  //find the target user and check if the login id exist
  const targetUser = await User.findById(followId);

  const alreadyFollowing = targetUser?.followers?.find(
    (user) => user?.toString() === loginUserId.toString()
  );

  if (alreadyFollowing) throw new Error("You have already followed this user");

  //1. Find the user you want to follow and update it's followers field
  await User.findByIdAndUpdate(
    followId,
    {
      $push: { followers: loginUserId },
      isFollowing: true,
    },
    { new: true }
  );

  //2. Update the login user following field
  await User.findByIdAndUpdate(
    loginUserId,
    {
      $push: { following: followId },
    },
    { new: true }
  );
  res.json("You have successfully followed this user");
});

//------------------------------
//unfollow
//------------------------------

const unfollowUserCtrl = expressAsyncHandler(async (req, res) => {
  const { unFollowId } = req.body;
  const loginUserId = req.user.id;

  await User.findByIdAndUpdate(
    unFollowId,
    {
      $pull: { followers: loginUserId },
      isFollowing: false,
    },
    { new: true }
  );

  await User.findByIdAndUpdate(
    loginUserId,
    {
      $pull: { following: unFollowId },
    },
    { new: true }
  );

  res.json("You have successfully unfollowed this user");
});

const blockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked: true },
    { new: true }
  );

  res.json(user);
});

const unBlockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked: false },
    { new: true }
  );

  res.json(user);
});

const generateVarificationTokenCtrl = expressAsyncHandler(async (req, res) => {
  const loginUserId = req.user.id;
  const { email } = req.user;

  const user = await User.findById(loginUserId);
  //console.log(user)

  try {
    const verificationToken = await user.createAccountVerificationToken();

    //save the user in db
    await user.save();
    //console.log(verificationToken);

    const resetURL = `Gaandu jaldi se verify kr de 10 minute ke andar <a href="http://localhost:3000/verify-account/${verificationToken}">Touch me!</a>`;

    mailSender(email, "verify email", `${resetURL}`);

    res.json(resetURL);
  } catch (error) {
    res.json(error);
  }
});

/// Account verification after sending email

const accountVerificationCtrl = expressAsyncHandler(async (req, res) => {
  const { token } = req.body;
  const hashToken = crypto.createHash("sha256").update(token).digest("hex");

  //find the user by the token

  const userFound = await User.findOne({
    accountVerificationToken: hashToken,
    accountVerificationTokenExpires: { $gt: new Date() },
  });

  if (!userFound) throw new Error("token expired, try again");

  userFound.isAccountVerified = true;
  userFound.accountVerificationToken = undefined;
  userFound.accountVerificationTokenExpires = undefined;
  await userFound.save();

  res.json(userFound);
});

const forgotPasswordTokenGenerator = expressAsyncHandler(async (req, res) => {
  //find the user by email
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) throw new Error("user not found with this email address");

  try {
    const token = await user.createPasswordResetToken();
    await user.save();

    const resetURL = `Gaandu jaldi se password reset kr de 10 minute ke andar <a href="http://localhost:3000/reset-password/${token}">Touch me!</a>`;

    mailSender(email, "reset-password", `${resetURL}`);

    //console.log(token);
    res.json(` a verification message is sent to the email address of ${user?.email}. Reset now within 10 minutes
   ${resetURL}`);
  } catch (error) {
    res.json(error);
  }
});

const passwordResetCtrl = expressAsyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  console.log("this is=>>", hashedToken);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("token expired try again later");
  // update password of the user
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  await user.save();

  res.json(user);
});

const profilePhotoUploadCtrl = expressAsyncHandler(async (req, res) => {
  //get the path to the image
  const { _id } = req.user;

  const localPath = `public/images/profile/${req.file.filename}`;

  //upload to the cloudinary

  const imgUploaded = await cloudinaryUploadImg(localPath);

  const foundUser = await User.findByIdAndUpdate(
    _id,
    {
      profilePhoto: imgUploaded?.url,
    },
    { new: true }
  );
  fs.unlinkSync(localPath);

  //console.log(imgUploaded);
  res.json(foundUser);
});

module.exports = {
  generateVarificationTokenCtrl,
  userRegisterCtrl,
  loginUserCtrl,
  fetchUsersCtrl,
  deleteUsersCtrl,
  fetchUserDetailsCtrl,
  userProfileCtrl,
  updateUserCtrl,
  updateUserPasswordCtrl,
  followingUserCtrl,
  unfollowUserCtrl,
  blockUserCtrl,
  unBlockUserCtrl,
  accountVerificationCtrl,
  forgotPasswordTokenGenerator,
  passwordResetCtrl,
  profilePhotoUploadCtrl,
};
