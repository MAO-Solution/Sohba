// Long-running server (local dev, Render, any VPS). On Vercel, /app.js exports the same app.
import app from './app.js';

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Sohba running on http://localhost:${PORT}`));
