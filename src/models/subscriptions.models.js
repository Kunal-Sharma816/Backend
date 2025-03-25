import mongoose , {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:
    {
        type: Schema.Types.ObjectId, // one who is scuscribing
        ref : "User",
    },
    channel: 
    {
        types: Schema.Types.ObjectId , // one to whome "Subscriber" is subscribing
        ref: "User" 
    }

} , {timestamps:true})

export const Subscription = mongoose.model("Subscription" , subscriptionSchema) 