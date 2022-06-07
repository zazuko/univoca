import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { Collection } from 'alcaeus'
import { univoca } from '@univoca/core/ns.js'
import { rdf } from '@tpluscode/rdf-ns-builders/strict'

export interface DimensionsState {
  collection: null | Collection,
}

const initialState = {
  entrypoint: null,
  collection: null,
}

const getters: GetterTree<DimensionsState, RootState> = {
  dimensions (state) {
    return state.collection?.member ?? []
  },
}

const actions: ActionTree<DimensionsState, RootState> = {
  async fetch (context) {
    const entrypoint = context.rootState.api.entrypoint
    const collection = entrypoint?.getCollections({
      predicate: rdf.type,
      object: univoca.Dimension,
    })?.shift()

    if (!collection) throw new Error('Shared dimensions URI not found')

    const dimensions = await api.fetchResource(collection.id.value)
    context.commit('storeDimensions', dimensions)

    return dimensions
  },
}

const mutations: MutationTree<DimensionsState> = {
  storeDimensions (state, collection) {
    state.collection = collection
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
