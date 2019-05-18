import cors from '@koa/cors'
import Koa from 'koa'
import helmet from 'koa-helmet'
import Router from 'koa-router'
import { IS_DEV } from './env'
import { logger } from './middleware'
import { errorHandler } from './middleware/errors'
import { apiRouter, authRouter } from './routes'

export const app = new Koa()
const router = new Router()

if (!IS_DEV) {
  app.proxy = true
} else {
  app.use(cors({ exposeHeaders: ['x-auth-token'] }))
}

app
  .use(helmet({ hsts: false }))
  .use(logger)
  .use(errorHandler)

const registerRoutes = (first: Router | Router[], ...routes: Router[]) => {
  const rs = Array.isArray(first) ? [...first, ...routes] : [first, ...routes]
  rs.forEach(r => router.use(r.routes(), r.allowedMethods()))

  app.use(router.routes()).use(router.allowedMethods())
}

registerRoutes(apiRouter, authRouter)