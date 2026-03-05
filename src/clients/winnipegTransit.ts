import { request } from "undici";
import { Cache } from "../services/cache";

const BASE_URL = "https://api.winnipegtransit.com/v4";
const CACHE_TTL_MS = 20000; // 20 seconds (middle of 15-30s range)

export interface Arrival {
    route: string;
    routeName?: string;
    scheduledArrival: string | null;
    estimatedArrival: string | null;
    scheduledDeparture: string | null;
    estimatedDeparture: string | null;
    cancelled: boolean;
}

export interface ArrivalsResponse {
    stopId: string;
    stopName: string;
    arrivals: Arrival[];
    updatedAt: string;
}

export class WinnipegTransitClient {
    private apiKey: string;
    private scheduleCache: Cache<any>;
    private arrivalsCache: Cache<ArrivalsResponse>;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.scheduleCache = new Cache<any>(CACHE_TTL_MS);
        this.arrivalsCache = new Cache<ArrivalsResponse>(CACHE_TTL_MS);
    }

    async getStopSchedule(stopId: string): Promise<any> {
        // Check cache first
        const cacheKey = `schedule:${stopId}`;
        const cached = this.scheduleCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch from API
        const url = `${BASE_URL}/stops/${stopId}/schedule.json?api-key=${this.apiKey}`;

        const response = await request(url);

        if (response.statusCode >= 400) {
            const text = await response.body.text();
            throw new Error(`Winnipeg Transit API Error: ${response.statusCode} ${text}`);
        }

        const data = await response.body.json();

        // Store in cache
        this.scheduleCache.set(cacheKey, data);

        return data;
    }

    async getStopArrivals(stopId: string): Promise<ArrivalsResponse> {
        // Check cache first
        const cacheKey = `arrivals:${stopId}`;
        const cached = this.arrivalsCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch from API (this will use its own cache)
        const data = await this.getStopSchedule(stopId);

        const arrivals: Arrival[] = [];
        const routeSchedules = data?.["stop-schedule"]?.["route-schedules"] || [];

        for (const routeSchedule of routeSchedules) {
            const route = routeSchedule?.route;
            const routeNumber = route?.number || route?.["#text"] || "Unknown";
            const routeName = route?.name || route?.["#text"] || "";
            const scheduledStops = routeSchedule?.["scheduled-stops"] || [];

            for (const scheduledStop of scheduledStops) {
                const times = scheduledStop?.times || {};
                const arrival = times?.arrival || {};
                const departure = times?.departure || {};

                arrivals.push({
                    route: routeNumber,
                    routeName: routeName,
                    scheduledArrival: arrival?.scheduled || null,
                    estimatedArrival: arrival?.estimated || null,
                    scheduledDeparture: departure?.scheduled || null,
                    estimatedDeparture: departure?.estimated || null,
                    cancelled: scheduledStop?.cancelled === "true" || scheduledStop?.cancelled === true,
                });
            }
        }

        // Sort by estimated arrival time (or scheduled if no estimate)
        arrivals.sort((a, b) => {
            const timeA = a.estimatedArrival || a.scheduledArrival || "";
            const timeB = b.estimatedArrival || b.scheduledArrival || "";
            return timeA.localeCompare(timeB);
        });

        const result: ArrivalsResponse = {
            stopId,
            stopName: data?.["stop-schedule"]?.stop?.name || "Unknown",
            arrivals,
            updatedAt: new Date().toISOString(),
        };

        // Store in cache
        this.arrivalsCache.set(cacheKey, result);

        return result;
    }
}
