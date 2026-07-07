import type { FastifyInstance } from 'fastify'
import { SHORT_ID_ROUTE } from '../constants/routes.js'
import { getDb } from '../db/index.js'
import { validateLinkedInUrl } from '../utils/urlValidator.js'
import { verifyLinkedInUsername, normalizeUsername } from '../services/linkedinVerify.js'

interface LinkBody {
  linkedin_url?: string
  linkedin_username?: string
}

export async function linkRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { short_id: string }; Body: LinkBody }>(
    SHORT_ID_ROUTE,
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { short_id } = request.params
      const { linkedin_url, linkedin_username } = request.body ?? {}

      let finalUrl: string
      let profileName: string | null = null

      if (linkedin_username) {
        const username = normalizeUsername(linkedin_username)
        if (!username) {
          return reply.code(422).send({ error: 'Nome de usuário inválido' })
        }

        const result = await verifyLinkedInUsername(username)
        if (result.status === 'not_found') {
          return reply.code(422).send({ error: 'Perfil não encontrado no LinkedIn. Verifique o nome de usuário.' })
        }
        if (result.status === 'error') {
          return reply.code(503).send({ error: 'Não foi possível verificar o perfil agora. Tente novamente.' })
        }

        finalUrl = result.url
        profileName = username
      } else if (linkedin_url) {
        const { valid, normalized } = validateLinkedInUrl(linkedin_url)
        if (!valid) {
          return reply.code(422).send({ error: 'URL do LinkedIn inválida' })
        }
        finalUrl = normalized
      } else {
        return reply.code(422).send({ error: 'Informe o usuário ou URL do LinkedIn' })
      }

      const db = getDb()
      const code = db
        .prepare('SELECT id, linkedin_url FROM codes WHERE id = ?')
        .get(short_id) as { id: string; linkedin_url: string | null } | undefined

      if (!code) {
        return reply.code(404).send({ error: 'Código não encontrado' })
      }

      if (code.linkedin_url) {
        return reply.code(409).send({ error: 'Este código já foi cadastrado' })
      }

      db.prepare(
        "UPDATE codes SET linkedin_url = ?, linked_at = datetime('now') WHERE id = ?"
      ).run(finalUrl, short_id)

      return reply.code(200).send({ success: true, url: finalUrl, name: profileName })
    }
  )
}
