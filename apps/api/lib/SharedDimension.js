import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { univoca } from './ns.js'

export function injectTermsLink(req, pointer) {
  pointer.any().has(rdf.type, schema.DefinedTermSet).forEach((termSet) => {
    const terms = new URL('/dimension/_terms', termSet.value)
    terms.searchParams.set('dimension', termSet.value)
    termSet.addOut(univoca.terms, termSet.namedNode(terms.toString()))
  })
}
