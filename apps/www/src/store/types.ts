/* eslint-disable no-use-before-define */
import { VuexOidcState } from 'vuex-oidc'
import { NamedNode, Term } from 'rdf-js'
import { AppState } from './modules/app'
import { APIState } from './modules/api'
import { Actions } from '@/api/mixins/ApiResource'
import { HierarchyState } from './modules/hierarchy'
import { HierarchiesState } from './modules/hierarchies'
import { DimensionsState } from './modules/dimensions'
import { DimensionState } from './modules/dimension'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Collection } from 'alcaeus'

export interface RootState {
  app: AppState
  auth: VuexOidcState
  api: APIState
  hierarchy: HierarchyState
  hierarchies: HierarchiesState
  dimensions: DimensionsState
  dimension: DimensionState
}

export interface Resource extends RdfResourceCore {
  clientPath: string
  actions: Actions
}

export interface Path extends RdfResourceCore {
  inversePath: NamedNode | undefined
}

export interface NextInHierarchy extends RdfResourceCore {
  name: string
  property: Path
  targetType: NamedNode[]
  nextInHierarchy: NextInHierarchy | undefined
}

export interface Hierarchy extends Resource {
  name: string
  dimension: NamedNode
  hierarchyRoot: NamedNode[]
  nextInHierarchy: NextInHierarchy
}

export interface Dimension extends Collection<DimensionTerm> {
  name?: string
  terms?: Term
  validThrough?: Date
  export?: Resource
}

export interface DimensionTerm extends Resource {
  name: Term[]
  identifiers: string[]
  validThrough?: Date
  canonical: Term | undefined
  newlyCreated?: boolean
}
