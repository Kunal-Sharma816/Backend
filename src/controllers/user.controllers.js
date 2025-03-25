import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {jwt} from 'jsonwebtoken'

// method for generating access and referesh tokens

const generateAccessAndRefreshTokens = async(userId)=>
{
  try {
    const user =  await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()


    user.refreshToken  = refreshToken
    await user.save({validateBeforeSave: false })

    return {accessToken ,refreshToken}

  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating referesh and access token"
    );
  }
}

const registerUser = asyncHandler(async (req, res) => {
  /**
   ----------for registering user we have to follow some steps--------------
  1. get users details from frontend
  2. validation (check every thing required or email in correct fromate) , check everything should we filled not empty
  3. check if user already exists: username or email or both
  4. check for images , check for avatar
  5. if available upload them on cloudnary, check avatar successfully uploaded on cloudnary or not
  6. create user object - create entry in DB calls
  7. remove password and refreshTokens field from response
  8. check for user creation
  9. return res
   */

  //step 1:
  const { fullName, email, username, password } = req.body;
  console.log("email:  ", email);

  //step 2

  /**
   * method- 1
    if (fullName === "") {
      throw new ApiError(400, "fullname is required");
    }
    if (email === "") {
      throw new ApiError(400, "email is required");
    }
    if (username === "") {
      throw new ApiError(400, "username is required");
    }
    if (password === "") {
      throw new ApiError(400, "password is required");
    }
   */

  // method-2
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are compulsory");
  }

  // step3
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("Existeduser: ", existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // step 4
  const avatarLocalPath = req.files?.avatar[0]?.path; // local path for avatar
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; // local path for coverImage

  // checking whether user send coverImage or not;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  console.log("Request from files: ", req.files);
  // check avatar
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // step 5 - upload on cloudnary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  console.log("Request from body: ", req.body);

  // check avatar uploaded successfully
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required,please check");
  }

  // step 6
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ", // check whether  user give coverImage or not
    email,
    password,
    username: username.toLowerCase(),
  });

  //step 7- remove password and refreshTokens field from response
  //check wether user is created or not and then using this "select()" method remove whatever field you don't want
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // step 8 - check for user creation
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  // step 9 - return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  // username or email
  // find user
  // if find check password
  // if  password check,then access and refresh token
  // send cookies
  // also send response

  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const {accessToken ,refreshToken}  = await generateAccessAndRefreshTokens(user._id)


  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken , options)
  .cookie("refreshToken",refreshToken , options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser , refreshToken , accessToken
      },
      "User logged in successfully"
    )
  )
})


const logoutUser = asyncHandler(async(req , res)=>
{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new:true
    }
  )
  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200 , {} , "User logged Out successfully"))

})


const refreshAccessToken = asyncHandler(async(req , res)=>
{
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken)
  {
    throw new ApiError(401 , "unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    console.log(decodedToken)
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user)
    {
      throw new ApiError(401 , "Invalid Referesh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken)
    {
      throw new ApiError(401 , "Referesh token is expired or used")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken , newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refershToken" , newrefreshToken , options)
    .json(
      new ApiResponse(
        200 ,
        {
          accessToken , refreshToken: newrefreshToken
        }
      )
    )
  } catch (error) {
    throw new ApiError(401 , error?.message || "Invalid refersh token")
  }

})


// functionality to change password
const changeCurrentPassword = asyncHandler(async(req ,res)=>
{
  const {oldPassword ,newPassword} = req.body;
  
  const user = await User.findById(req.user?._id)
  
  const isPasswordCorrect  = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect)
  {
    throw new ApiError(400 , "Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200 , {} , "Password changed successfully"))

})


const getCurrentUser = asyncHandler(async(req , res)=>
{
  return res
  .status(200)
  .json(200 , req.user, "Current user fetched successfully")
})


// textual data updation
const updateAccountDetails = asyncHandler(async(req , res)=>
{
  const {fullname , email} = req.body;

  if(!(fullname || email))
  {
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname,
        email: email
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200 ,user , "Account details successfully"))
})


// file updation
const updateUserAvatar = asyncHandler(async(req , res)=>
{
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath)
  {
    throw new ApiError(400 ,  "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url)
  {
    throw new ApiError(400 ,  "Error while uploading avatar on cloudnary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(200 , user , "Avatar is updated successfully")

})

const updateUserCoverImage = asyncHandler(async(req , res)=>
  {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath)
    {
      throw new ApiError(400 ,  "Cover image file is missing")
    }
  
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
    if(!coverImage.url)
    {
      throw new ApiError(400 ,  "Error while uploading cover image on cloudnary")
    }
  
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          coverImage: coverImage.url
        }
      },
      {new:true}
    ).select("-password")
  
    return res
    .status(200)
    .json(200 , user , "Cover Image is updated successfully")
  
  })




export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken,
  changeCurrentPassword, 
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage
};
