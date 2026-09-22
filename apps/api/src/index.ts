import 'dotenv/config';
import app from './app.js';
import { connectDb } from './utils/db.js';
import { env } from './utils/env.js';
import { seedInitialAdmin } from './services/seedAdmin.js';

const PORT = env.PORT;

async function start() {
  // Start HTTP server immediately so port 4000 is listening right away
  const server = app.listen(PORT, () => {
    console.info(`🚀 API server running on http://localhost:${PORT}`);
    console.info(`   Environment: ${env.NODE_ENV}`);
  });

  try {
    await connectDb();
    await seedInitialAdmin();
  } catch (err: unknown) {
    console.error('Failed to initialize database:', err);
    server.close();
    process.exit(1);
  }
}

start().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
