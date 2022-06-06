import { dcterms, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import httpError from 'http-errors'
import { univoca, meta } from '@univoca/core/ns.js'
import * as CONST from './rdf.js'

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
  pointer
    .out(univoca.termShape)
    .addOut(sh.targetClass, req.rdf.namedNode(`/term-type/${pointer.out(dcterms.identifier).value}`))
    .addOut(sh.deactivated, true)

  // TODO: when univoca:dimension is blank node, turn it into a URI
}

export function removeGeneratedProperties({ after }) {
  after.deleteOut([
    univoca.terms,
    univoca.export,
  ])
  after.deleteOut(rdf.type, createdDimensionTypes)
}

export function updateTermShapeConstraints({ after }) {
  after.out(univoca.termShape).out(sh.property)
    .forEach((property) => {
      const required = CONST.TRUE.equals(property.out(univoca.required).term)
      const maxOne = CONST.FALSE.equals(property.out(univoca.multipleValues).term)

      property.deleteOut(sh.minCount).deleteOut(sh.maxCount)

      if (required) {
        property.addOut(sh.minCount, 1)
      }
      if (maxOne) {
        property.addOut(sh.maxCount, 1)
      }
    })
}
