import { app } from './app.js'
import { config } from './config.js'
import './db.js'

app.listen(config.port, () => {
  console.log(`[towerhub-server] listening on http://localhost:${config.port} (client origin: ${config.clientOrigin})`)
})
