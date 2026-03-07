import { type App } from '@example/api/app';
import { hc } from 'hono/client';

export const api = hc<App>('http://localhost:3000');
