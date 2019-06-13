import cors from '@koa/cors'
import Koa from 'koa'
import helmet from 'koa-helmet'
import Router from 'koa-router'
import { IS_DEV } from './env'
import { logger } from './middleware'
import { cacheHeaders } from './middleware/cache'
import { errorHandler } from './middleware/errors'
import { realIP } from './middleware/realIP'
import { routes } from './routes'

export const app = new Koa()
const router = new Router()

if (!IS_DEV) app.proxy = true
else app.use(cors({ exposeHeaders: ['x-auth-token'] }))

app
  .use(realIP)
  .use(helmet({ hsts: false }))
  .use(logger)
  .use(errorHandler)
  .use(cacheHeaders)

router.get('/health', ctx => (ctx.status = 200))
routes.forEach(r => router.use(r.routes(), r.allowedMethods()))
app.use(router.routes()).use(router.allowedMethods())
