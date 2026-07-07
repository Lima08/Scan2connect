import type { FastifyRequest, FastifyReply } from 'fastify'
import { ADMIN_SESSION_MAX_AGE_MS } from '../constants/session.js'

interface AdminSession {
  authenticated?: boolean
  authenticatedAt?: number
}

export async function adminAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const session = request.session as AdminSession

  if (!session.authenticated) {
    return reply.redirect('/admin/login', 302)
  }

  const authenticatedAt = session.authenticatedAt
  if (authenticatedAt && Date.now() - authenticatedAt > ADMIN_SESSION_MAX_AGE_MS) {
    await request.session.destroy()
    return reply.redirect('/admin/login', 302)
  }
}
