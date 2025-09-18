import mongoose from "mongoose";
function connectDB() {
    const URL = `${process.env.MONGO_URI}`;
    console.log("Connecting to MongoDB...");
    return mongoose.connect(URL); // Return the promise
}

export default connectDB;
