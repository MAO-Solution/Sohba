// Vercel entry: zero-config Express looks for a root file that imports express and exports the app.
// Static files in public/ are served by Vercel's CDN.
import express from 'express'; // eslint-disable-line no-unused-vars -- needed for Vercel's entrypoint detection
import app from './server/app.js';

export default app;
