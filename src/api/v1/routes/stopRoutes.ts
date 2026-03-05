import { Router, Request, Response } from 'express';
import { WinnipegTransitClient } from '../../../clients/winnipegTransit';

const router = Router();

// Initialize client - will be injected via middleware or constructor pattern
let transitClient: WinnipegTransitClient;

export function setTransitClient(client: WinnipegTransitClient): void {
    transitClient = client;
}

router.get("/stops/:stopId/schedule.json", async (req: Request, res: Response) => {
    try {
        const stopId = Array.isArray(req.params.stopId) ? req.params.stopId[0] : req.params.stopId;
        const data = await transitClient.getStopSchedule(stopId);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching stop schedule:", error);
        if (error instanceof Error && error.message.includes("API Error")) {
            const match = error.message.match(/API Error: (\d+)/);
            const statusCode = match ? parseInt(match[1]) : 500;
            const text = error.message.replace(/Winnipeg Transit API Error: \d+ /, '');
            return res.status(statusCode).send(text);
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/stops/:stopId/arrivals", async (req: Request, res: Response) => {
    try {
        const stopId = Array.isArray(req.params.stopId) ? req.params.stopId[0] : req.params.stopId;
        const data = await transitClient.getStopArrivals(stopId);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching stop arrivals:", error);
        if (error instanceof Error && error.message.includes("API Error")) {
            const match = error.message.match(/API Error: (\d+)/);
            const statusCode = match ? parseInt(match[1]) : 500;
            const text = error.message.replace(/Winnipeg Transit API Error: \d+ /, '');
            return res.status(statusCode).json({ error: text });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;