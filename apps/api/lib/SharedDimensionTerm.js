import { dcterms, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { univoca, meta } from '@univoca/core/ns.js'
import { rename } from './rdf.js'

export async function ensureSharedTermProperties(req, pointer) {
  if (req.method === 'POST') {
    // only when creating new terms
    const termSet = await req.hydra.resource.clownface()
    const sharedDimension = termSet.out(univoca.dimension)
    const univocaTermType = termSet.out(univoca.termShape).out(sh.targetClass)

    pointer.addOut(rdf.type, univocaTermType)
    pointer.out(univoca.term)
      .addOut(rdf.type, [
        schema.DefinedTerm,
        meta.SharedDimensionTerm,
      ])
      .addOut(schema.inDefinedTermSet, sharedDimension)

    const identifier = pointer.out(dcterms.identifier)
    const termUri = pointer.namedNode(`${sharedDimension.value}/${identifier.value}`)
    rename(pointer, pointer.out(univoca.term).term, termUri.term)
  }
}
