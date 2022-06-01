import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import httpError from 'http-errors'
import { univoca, meta } from './ns.js'

export function injectTermsLink(req, pointer) {
  pointer.any().has(rdf.type, schema.DefinedTermSet).forEach((termSet) => {
    const terms = new URL(req.rdf.namedNode('/terms').value)
    terms.searchParams.set('dimension', termSet.value)
    termSet.addOut(univoca.terms, termSet.namedNode(terms.toString()))
  })
}

const createdDimensionTypes = [univoca.NewDimension, univoca.ImportedDimension]

export function prepareCreated(req, pointer) {
  // TODO https://github.com/hypermedia-app/creta/issues/388
  if (req.method === 'POST' && !pointer.has(rdf.type, createdDimensionTypes).terms.length) {
    throw new httpError.BadRequest('Missing expected RDF type')
  }

  pointer
    .out(univoca.dimension)
    .addOut(rdf.type, [meta.SharedDimension, schema.DefinedTermSet])

  // TODO: when univoca:dimension is blank node, turn it into a URI
}

export function removeGeneratedProperties({ after }) {
  after.deleteOut([
    univoca.terms,
    univoca.export,
  ])
  after.deleteOut(rdf.type, createdDimensionTypes)
}
