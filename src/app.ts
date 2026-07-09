import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import rateLimit from '@fastify/rate-limit'
import formbody from '@fastify/formbody'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { runMigrations } from './db/migrations.js'
import { redirectRoutes } from './routes/redirect.js'
import { linkRoutes } from './routes/link.js'
import { adminAuthRoutes } from './routes/admin/auth.js'
import { adminCodesRoutes } from './routes/admin/codes.js'
import { adminQrRoutes } from './routes/admin/qr.js'
import { adminUnlinkRoutes } from './routes/admin/unlink.js'
import { ADMIN_SESSION_MAX_AGE_MS } from './constants/session.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function buildApp() {
  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== 'test') {
    throw new Error('ADMIN_PASSWORD environment variable is required')
  }
  runMigrations()
  const behindHttps = process.env.BASE_URL?.startsWith('https://') ?? false
  const app = Fastify({
    logger: false,
    trustProxy: behindHttps,
  })

  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/',
  })

  app.register(formbody)
  app.register(fastifyCookie)

  app.register(fastifySession, {
    secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me-in-production!',
    cookie: {
      secure: behindHttps,
      sameSite: 'lax',
      httpOnly: true,
      maxAge: ADMIN_SESSION_MAX_AGE_MS,
    },
  })

  app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
  })

  app.get('/health', async () => ({ status: 'ok' }))

  app.register(redirectRoutes)
  app.register(linkRoutes)
  app.register(adminAuthRoutes)
  app.register(adminCodesRoutes)
  app.register(adminQrRoutes)
  app.register(adminUnlinkRoutes)

  return app
}
