import { Constructor, RdfResource } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { commonActions } from '@/api/common'
import { NamedNode } from 'rdf-js'
import { RuntimeOperation } from 'alcaeus'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { displayLanguage } from '@/displayLanguage'

export interface Actions {
  [key: string]: RuntimeOperation | null
  create: RuntimeOperation | null
  edit: RuntimeOperation | null
  replace: RuntimeOperation | null
  delete: RuntimeOperation | null
}

export interface AdditionalActions {
  _additionalActions: Record<string, NamedNode>
}

declare module '@tpluscode/rdfine' {
  export interface RdfResource extends Partial<AdditionalActions> {
    clientPath: string
    actions: Actions
    displayLabel: string | undefined
  }
}

export function apiResourceMixin (rootUrl: string, separator: string): Mixin {
  function ApiResourceMixin<Base extends Constructor<RdfResource>> (base: Base) {
    class BaseClass extends base {
      get clientPath () {
        return this.id.value.replace(rootUrl, '').replace(/\//g, separator)
      }

      get actions (): Actions {
        return commonActions(this, this._additionalActions)
      }

      get displayLabel () : string | undefined {
        return this.pointer.out(rdfs.label, { language: displayLanguage }).value
      }
    }

    return BaseClass
  }

  ApiResourceMixin.shouldApply = true

  return ApiResourceMixin
}
