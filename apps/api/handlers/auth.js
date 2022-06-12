import fetch from 'node-fetch'
import { expressjwt as jwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import { Router } from 'express'

const createJwtHandler = jwksUri => jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri,
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH_AUDIENCE,
  issuer: process.env.AUTH_ISSUER,
  algorithms: ['RS256'],
  credentialsRequired: false,
})

function setUserId(req, res, next) {
  if (req.user?.sub) {
    req.agent = req.rdf.namedNode(`/user/${req.user.sub}`)
  }
  return next()
}

export default async () => {
  const router = Router()

  const response = await fetch(`${process.env.AUTH_ISSUER}/.well-known/openid-configuration`)
  if (response.ok) {
    const oidcConfig = await response.json()
    router.use(createJwtHandler(oidcConfig.jwks_uri))
  }

  router.use(setUserId)

  return router
}
