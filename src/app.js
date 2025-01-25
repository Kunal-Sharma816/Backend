import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
))  // this use method is used to set  middlewars 

// for getting data from json
app.use(express.json({limit: "16kb"}))

// for getting data from URLs
app.use(express.urlencoded({extended:true , limit: "16kb"}))  // extended is used for working objects inside the object


app.use(express.static("public"))

app.use(cookieParser())



export { app }