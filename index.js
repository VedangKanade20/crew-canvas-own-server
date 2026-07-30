import { server } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
dotenv.config();

connectDB()
    .then(() => {
        server.listen(process.env.PORT || 5000, () => {
            console.log(`⚙️ Server is running at port: ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("something went wrong ", err);
    });
