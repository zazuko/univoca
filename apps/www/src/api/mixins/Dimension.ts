import { Constructor, property } from '@tpluscode/rdfine'
import { univoca } from '@univoca/core/ns.js'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { Dimension } from '@/store/types'

export default function mixin<Base extends Constructor> (base: Base) {
  class Impl extends base implements Partial<Dimension> {
    @property.literal({ path: schema.name })
    name!: string

    get isExternal () {
      return this.types.has(univoca.ExternalDimension)
    }
  }

  return Impl
}

mixin.appliesTo = univoca.Dimension
