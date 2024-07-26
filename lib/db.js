import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connects to MongoDB.
 */
const ConnectDB = async () => {
    const db = process.env.MONGO_DB_URI;

    try {
        await mongoose.connect(db,
            {

            });
        console.log('Connected to MongoDB successfully!')
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
export default ConnectDB;