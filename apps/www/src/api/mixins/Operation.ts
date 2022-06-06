import { Constructor, property } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { hydra } from '@tpluscode/rdf-ns-builders/strict'
import RdfResource from '@tpluscode/rdfine/RdfResource'
import { hex } from '@hydrofoil/vocabularies/builders'

declare module '@rdfine/hydra' {
  interface Operation {
    multiPartPaths: Array<RdfResource>
  }
}

export default function mixin<Base extends Constructor> (base: Base): Mixin {
  class Impl extends base {
    @property.resource({ path: hex.multiPartPath, values: 'array' })
    multiPartPaths!: Array<RdfResource>
  }

  return Impl
}

mixin.appliesTo = hydra.Operation
