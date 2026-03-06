import { Hono } from 'hono';
import { ping } from '#src/ping.ts';

export const app = new Hono().get('/ping', (c) => c.text(ping()));

export type App = typeof app;
