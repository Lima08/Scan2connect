import type { FastifyInstance } from 'fastify'
import { ZipArchive } from 'archiver'
import { buffer } from 'node:stream/consumers'
import { PassThrough } from 'node:stream'
import { getDb } from '../../db/index.js'
import { adminAuth } from '../../middleware/adminAuth.js'
import { generateQRPng } from '../../services/qrcode.js'
import { normalizeUsername } from '../../services/linkedinVerify.js'
import { generateUniqueId } from '../../utils/idGenerator.js'
import { extractLinkedInProfileSlug } from '../../utils/urlValidator.js'

const MAX_ZIP_EXPORT = 1000

interface CodesQuery {
  status?: 'all' | 'linked' | 'unlinked'
  page?: string
  limit?: string
  q?: string
}

interface ExportQuery {
  format?: 'csv' | 'zip'
  status?: 'all' | 'linked' | 'unlinked'
}

interface CodeRow {
  id: string
  linkedin_url: string | null
  scan_count: number
  linked_at: string | null
  created_at: string
}

function buildStatusWhere(status: 'all' | 'linked' | 'unlinked'): string {
  if (status === 'linked') return 'WHERE linkedin_url IS NOT NULL'
  if (status === 'unlinked') return 'WHERE linkedin_url IS NULL'
  return ''
}

function fetchCodesForExport(status: 'all' | 'linked' | 'unlinked'): CodeRow[] {
  const db = getDb()
  const whereClause = buildStatusWhere(status)
  return db.prepare(
    `SELECT id, linkedin_url, scan_count, linked_at, created_at FROM codes ${whereClause} ORDER BY created_at DESC`
  ).all() as CodeRow[]
}

function buildQrUrl(id: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${id}`
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsv(codes: CodeRow[], baseUrl: string): string {
  const header = 'id,qr_url,status,linkedin_url,scan_count,created_at,linked_at'
  const rows = codes.map((code) => {
    const status = code.linkedin_url ? 'linked' : 'unlinked'
    return [
      escapeCsv(code.id),
      escapeCsv(buildQrUrl(code.id, baseUrl)),
      escapeCsv(status),
      escapeCsv(code.linkedin_url),
      escapeCsv(code.scan_count),
      escapeCsv(code.created_at),
      escapeCsv(code.linked_at),
    ].join(',')
  })
  return [header, ...rows].join('\n')
}

function exportFilename(prefix: string, status: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}-${status}-${date}`
}

async function buildZipBuffer(codes: CodeRow[], baseUrl: string): Promise<Buffer> {
  const archive = new ZipArchive({ zlib: { level: 6 } })
  const passthrough = new PassThrough()
  archive.pipe(passthrough)

  for (const code of codes) {
    const png = await generateQRPng(code.id, baseUrl)
    archive.append(png, { name: `${code.id}.png` })
  }

  await archive.finalize()
  return buffer(passthrough)
}

export async function adminCodesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', adminAuth)

  app.get('/admin', async (_request, reply) => {
    return reply.sendFile('admin.html')
  })

  app.get<{ Querystring: CodesQuery }>('/admin/codes', async (request, reply) => {
    const db = getDb()
    const status = request.query.status ?? 'all'
    const page = Math.max(1, parseInt(request.query.page ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(request.query.limit ?? '50', 10)))
    const offset = (page - 1) * limit

    const conditions: string[] = []
    const params: unknown[] = []

    if (status === 'linked') conditions.push('linkedin_url IS NOT NULL')
    else if (status === 'unlinked') conditions.push('linkedin_url IS NULL')

    const rawQuery = request.query.q?.trim() ?? ''
    if (rawQuery.length > 0) {
      const normalized = normalizeUsername(rawQuery)
      const idPattern = `%${rawQuery}%`
      const urlPattern = `%${normalized || rawQuery}%`
      conditions.push('(LOWER(id) LIKE LOWER(?) OR linkedin_url LIKE ?)')
      params.push(idPattern, urlPattern)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const total = (db.prepare(`SELECT COUNT(*) as count FROM codes ${whereClause}`).get(...params) as any).count
    const rows = db.prepare(
      `SELECT id, linkedin_url, scan_count, linked_at, created_at FROM codes ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as Array<{
      id: string
      linkedin_url: string | null
      scan_count: number
      linked_at: string | null
      created_at: string
    }>

    const codes = rows.map((code) => ({
      ...code,
      linkedin_username: code.linkedin_url
        ? extractLinkedInProfileSlug(code.linkedin_url)
        : null,
    }))

    const totalLinked = (db.prepare("SELECT COUNT(*) as count FROM codes WHERE linkedin_url IS NOT NULL").get() as any).count
    const totalAll = (db.prepare("SELECT COUNT(*) as count FROM codes").get() as any).count
    const scansToday = (db.prepare("SELECT COUNT(*) as count FROM codes WHERE DATE(linked_at) = DATE('now')").get() as any).count

    return reply.send({
      stats: { total: totalAll, linked: totalLinked, scansToday },
      codes,
      pagination: { page, limit, total },
    })
  })

  app.get<{ Querystring: ExportQuery }>('/admin/codes/export', async (request, reply) => {
    const format = request.query.format
    const status = request.query.status ?? 'all'

    if (format !== 'csv' && format !== 'zip') {
      return reply.code(422).send({ error: 'format deve ser csv ou zip' })
    }

    const codes = fetchCodesForExport(status)
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'

    if (format === 'zip' && codes.length > MAX_ZIP_EXPORT) {
      return reply.code(422).send({ error: `exportação ZIP limitada a ${MAX_ZIP_EXPORT} códigos` })
    }

    if (format === 'csv') {
      const csv = buildCsv(codes, baseUrl)
      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${exportFilename('codes', status)}.csv"`)
        .send(csv)
    }

    reply
      .header('Content-Type', 'application/zip')
      .header('Content-Disposition', `attachment; filename="${exportFilename('qrs', status)}.zip"`)
      .send(await buildZipBuffer(codes, baseUrl))
  })

  app.post<{ Body: { count?: number; event_id?: string } }>('/admin/codes', async (request, reply) => {
    const { count, event_id } = request.body ?? {}

    if (!count || typeof count !== 'number' || count < 1 || count > 1000) {
      return reply.code(422).send({ error: 'count deve ser um número entre 1 e 1000' })
    }

    const db = getDb()
    const ids: string[] = []

    const insertMany = db.transaction(() => {
      for (let i = 0; i < count; i++) {
        const id = generateUniqueId(db)
        db.prepare('INSERT INTO codes (id, event_id) VALUES (?, ?)').run(id, event_id ?? null)
        ids.push(id)
      }
    })

    insertMany()
    return reply.code(201).send({ ids })
  })
}
