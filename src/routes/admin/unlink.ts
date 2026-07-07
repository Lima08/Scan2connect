import type { FastifyInstance } from 'fastify'
import { getDb } from '../../db/index.js'
import { adminAuth } from '../../middleware/adminAuth.js'

export async function adminUnlinkRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', adminAuth)

  app.post<{ Params: { id: string } }>('/admin/codes/:id/unlink', async (request, reply) => {
    const { id } = request.params
    const db = getDb()

    const code = db.prepare('SELECT id, linkedin_url FROM codes WHERE id = ?').get(id) as
      | { id: string; linkedin_url: string | null }
      | undefined

    if (!code) {
      return reply.code(404).send({ error: 'Código não encontrado' })
    }

    if (!code.linkedin_url) {
      return reply.code(409).send({ error: 'Código já está desvinculado' })
    }

    db.prepare('UPDATE codes SET linkedin_url = NULL, linked_at = NULL WHERE id = ?').run(id)
    return reply.send({ success: true })
  })
}
