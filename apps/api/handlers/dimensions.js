import conditional from 'express-conditional-middleware'
import { CreateMember } from '@hydrofoil/knossos/collection.js'
import { isMultipart } from '../lib/express.js'

export const post = conditional(isMultipart, postImportedDimension, CreateMember)

function postImportedDimension(req, res, next) {
  next(new Error('Not implemented'))
}
