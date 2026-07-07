import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { FastifyInstance } from 'fastify'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOGIN_TEMPLATE = readFileSync(join(__dirname, '../../../public/login.html'), 'utf-8')

const ERROR_BANNER = `<div class="flex items-center gap-sm px-sm py-sm bg-error-container text-on-error-container rounded-DEFAULT relative z-10" role="alert">
  <span class="material-symbols-outlined text-[18px]">error</span>
  <span class="font-label-md text-label-md">Senha incorreta. Tente novamente.</span>
</div>`

function renderLogin(showError = false): string {
  return LOGIN_TEMPLATE
    .replace('{{ERROR_BANNER}}', showError ? ERROR_BANNER : '')
    .replace('{{ERROR_INPUT_CLASS}}', showError ? 'border-error focus:border-error focus:ring-error' : '')
}

export async function adminAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/admin/login', async (_request, reply) => {
    return reply.type('text/html').send(renderLogin())
  })

  app.post<{ Body: { password?: string } }>('/admin/login', async (request, reply) => {
    const { password } = request.body ?? {}
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      return reply.code(500).send({ error: 'Senha de admin não configurada' })
    }

    if (password === adminPassword) {
      const session = request.session as { authenticated?: boolean; authenticatedAt?: number }
      session.authenticated = true
      session.authenticatedAt = Date.now()
      return reply.redirect('/admin', 302)
    }

    return reply.code(401).type('text/html').send(renderLogin(true))
  })

  app.post('/admin/logout', async (request, reply) => {
    await request.session.destroy()
    return reply.redirect('/admin/login', 302)
  })
}
