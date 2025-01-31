import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt" // used for encryption



const userSchema = new Schema({
    username: 
    {
        type: String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true,
        index:true,  // if you want to make any field searchble then make its index true
    },

    email: 
    {
        type: String,
        require: true,
        lowercase: true,
        unique: true,
        trim: true,        
    },

    fullname: 
    {
        type: String,
        require: true,
        trim: true,
        index: true,        
    },

    avatar: 
    {
        type: String,  // we use Cloudnary URL
        require: true,
             
    },

    coverImage: 
    {
        type: String,        
    },

    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],

    // challange
    password:
    {
        type: String,
        required: [true, 'Password is Reqiuired'],
        unique: true,         
    },

    refreshToken: 
    {
        type: String,
    }
    
},

{
    timestamps: true
}
)


// this is logic for saving the password in encypted form
userSchema.pre("save", async function(next){
    if(this.isModified("password"))
    {
        this.password = bcrypt.hash(this.password , 10)
        next()
    }
})


// if someone entre then this function will check the password 
// wether input password is correct or not
userSchema.methods.isPasswordCorrect = async function(password)
{
    return await bcrypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(

        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },

        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(

        {
            _id: this._id,
            
        },

        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFERESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User" , userSchema)
