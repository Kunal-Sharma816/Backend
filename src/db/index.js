import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>
{
    try {
        
        const connectIstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connectecd !! DB host:  ${connectIstance.connection.host}`); 

    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}


export default connectDB