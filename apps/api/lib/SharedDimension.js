import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { univoca } from './ns.js'

export function injectTermsLink(req, pointer) {
  pointer.any().has(rdf.type, schema.DefinedTermSet).forEach((termSet) => {
    const terms = new URL(req.rdf.namedNode('/terms').value)
    terms.searchParams.set('dimension', termSet.value)
    termSet.addOut(univoca.terms, termSet.namedNode(terms.toString()))
  })
}

export function prepareCreated(req, pointer) {
  pointer.addOut(rdf.type, univoca('SharedDimension.created'))
}

export function removeGeneratedProperties({ after }) {
  after.deleteOut([
    univoca.createAs,
    univoca.terms,
    univoca.export,
  ])
  after.deleteOut(rdf.type, univoca('SharedDimension.created'))
}
