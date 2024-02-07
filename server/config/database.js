import mongoose from "mongoose";

/**
 * Connect to the database
 */
export const connectDatabase = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};
