import chalk from "chalk";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { NODE_ENV, PORT } from "./src/config/env.js";

(async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running ${NODE_ENV === 'dev' && `on port: ${chalk.blue(`http://localhost:${PORT}`)}`}`);
        });
    } catch (error) {
        console.error("Failed to start the Server: ", error);
        setTimeout(() => process.exit(1), 500);
    }
})();
