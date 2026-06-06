import { config } from 'dotenv';
// Load .env.local for local development (Vercel injects vars in production)
config({ path: '.env.local' });
config({ path: '.env' }); // fallback

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use the unpooled URL for migrations (pgBouncer can't run DDL)
    url: process.env['DATABASE_URL_UNPOOLED'] ?? process.env['DATABASE_URL'],
  },
});
