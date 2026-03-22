import "dotenv/config";
import { createServer } from "./server.js";

const PORT = Number(process.env.PORT) || 4000;
const app = createServer();

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Server is running on http://localhost:${PORT}`);
} catch (error) {
  console.error("Failed to start the server:", error.message);
  process.exit(1);
}
