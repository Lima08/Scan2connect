export interface EnvConfig {
  PORT: number
  DB_PATH: string
  SESSION_SECRET: string
  ADMIN_PASSWORD: string
  BASE_URL: string
}

const REQUIRED = ['ADMIN_PASSWORD', 'BASE_URL'] as const

export function validateEnv(): EnvConfig {
  const missing = REQUIRED.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET not set — using random value. Sessions will not survive restarts.')
  }

  return {
    PORT: parseInt(process.env.PORT ?? '3000', 10),
    DB_PATH: process.env.DB_PATH ?? './data.db',
    SESSION_SECRET: process.env.SESSION_SECRET ?? Math.random().toString(36).slice(2).repeat(4),
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,
    BASE_URL: process.env.BASE_URL!,
  }
}
