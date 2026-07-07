import type { FastifyInstance } from 'fastify'
import { getDb } from '../../db/index.js'
import { adminAuth } from '../../middleware/adminAuth.js'
import { generateQRPng } from '../../services/qrcode.js'

export async function adminQrRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', adminAuth)

  app.get<{ Params: { id: string } }>('/admin/codes/:id/qr', async (request, reply) => {
    const { id } = request.params
    const db = getDb()
    const code = db.prepare('SELECT id FROM codes WHERE id = ?').get(id)

    if (!code) {
      return reply.code(404).send({ error: 'Código não encontrado' })
    }

    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
    const png = await generateQRPng(id, baseUrl)

    return reply.type('image/png').send(png)
  })
}
