import chalk from "chalk";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { PORT } from "./src/config/env.js";



(async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port: ${chalk.blue(`http://localhost:${PORT}`)}`);
        });
    } catch (error) {
        console.error("Failed to start the Server: ", error);
        process.exit(1);
    }
})();
