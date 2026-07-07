import type { FastifyInstance } from 'fastify'
import { SHORT_ID_ROUTE } from '../constants/routes.js'
import { getDb } from '../db/index.js'
import { isMobileUserAgent } from '../utils/userAgent.js'

export async function redirectRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { short_id: string } }>(SHORT_ID_ROUTE, async (request, reply) => {
    const { short_id } = request.params
    const db = getDb()
    const code = db.prepare('SELECT id, linkedin_url FROM codes WHERE id = ?').get(short_id) as
      | { id: string; linkedin_url: string | null }
      | undefined

    if (!code) {
      return reply.code(404).send({ error: 'Código não encontrado' })
    }

    if (code.linkedin_url) {
      db.prepare('UPDATE codes SET scan_count = scan_count + 1 WHERE id = ?').run(short_id)

      const ua = request.headers['user-agent'] ?? ''
      if (isMobileUserAgent(ua)) {
        return reply.redirect(`/open.html?url=${encodeURIComponent(code.linkedin_url)}`, 302)
      }

      return reply.redirect(code.linkedin_url, 302)
    }

    return reply.sendFile('register.html')
  })
}
