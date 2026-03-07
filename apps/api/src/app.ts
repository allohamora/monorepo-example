import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ping } from '#src/ping.ts';

export const app = new Hono().use(cors()).get('/ping', (c) => c.text(ping()));

export type App = typeof app;
