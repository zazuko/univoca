import { Constructor, property } from '@tpluscode/rdfine'
import { univoca } from '@univoca/core/ns.js'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { Dimension } from '@/store/types'
import { Literal, NamedNode } from 'rdf-js'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'

interface MetaTerm extends RdfResourceCore {
  termSet: NamedNode
}

function metaTerm<Base extends Constructor> (base: Base) {
  class Impl extends base implements Partial<MetaTerm> {
    @property({ path: schema.name, values: 'array' })
    name!: Literal[]

    @property.literal({ path: schema.identifier, values: 'array' })
    identifiers!: string[]
  }

  return Impl
}

export default function mixin<Base extends Constructor> (base: Base) {
  class Impl extends base implements Partial<Dimension> {
    @property.resource({ path: univoca.term, as: [metaTerm] })
    term!: MetaTerm
  }

  return Impl
}

mixin.appliesTo = univoca.DimensionTerm
