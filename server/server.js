import { app } from "./app.js";
import { config } from "dotenv";

// Services
import { connectDatabase } from "./config/database.js";

config({ path: "./config/config.env" });

// Connect Database
connectDatabase();

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});