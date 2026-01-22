import express from 'express';
import "dotenv/config";
import path from "path";
import healthRoutes from './api/v1/routes/healthRoutes';
import stopRoutes, { setTransitClient } from './api/v1/routes/stopRoutes';
import { WinnipegTransitClient } from './clients/winnipegTransit';

const app = express();
const PORT = Number(process.env.PORT) || 3009;

const API_KEY = process.env.WPG_TRANSIT_API_KEY?.trim();
if (!API_KEY) {
    throw new Error("Missing WPG Transit API Key in .env");
}

// Initialize transit client
const transitClient = new WinnipegTransitClient(API_KEY);
setTransitClient(transitClient);

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), "public")));

// Routes
app.use('/', healthRoutes);
app.use('/', stopRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
