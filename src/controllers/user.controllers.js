import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
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
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
  }

  console.log("Request from files: ", req.files)
  // check avatar
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

 
  // step 5 - upload on cloudnary
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  console.log("Request from body: ",req.body)
  


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
  return res.status(201).json(
    new ApiResponse(200 , createdUser , "User created successfully")
  )
});


