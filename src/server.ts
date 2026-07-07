import 'dotenv/config'
import { buildApp } from './app.js'
import { validateEnv } from './utils/env.js'

const env = validateEnv()
const app = buildApp()
app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) { console.error(err); process.exit(1) }
  console.log(`Server running at ${address}`)
})
