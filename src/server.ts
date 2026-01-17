import 'dotenv/config';
import Fastify from 'fastify';
import { z } from 'zod';

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3005),
    WPG_TRANSIT_API_KEY: z.string().min(1),
});

const env = envSchema.parse(process.env);

const app = Fastify({
    logger: true, // pino for logging
});

app.get('/', async () => (
    {status: 'ok'}
));

app.get('/health', async () => {
    return { ok: true, ts: new Date().toISOString() };
});

app.listen({ port: 3005 }, function (err, address) {
    if (err) {
        app.log.error(err)
        process.exit(1)
    }
    // Server is now listening on ${address}
});

export default app;