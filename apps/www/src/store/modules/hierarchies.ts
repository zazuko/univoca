import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { RootState } from '../types'
import { Collection } from 'alcaeus'
import { rdf } from '@tpluscode/rdf-ns-builders/strict'
import { univoca } from '@univoca/core/ns.js'

export interface HierarchiesState {
  collection: null | Collection,
}

const initialState = {
  collection: null,
}

const getters: GetterTree<HierarchiesState, RootState> = {}

const actions: ActionTree<HierarchiesState, RootState> = {
  async fetch (context) {
    const { entrypoint } = context.rootState.api
    const collectionURI = entrypoint?.getCollections({
      predicate: rdf.type,
      object: univoca.Hierarchy,
    })?.shift()

    if (!collectionURI) throw new Error('Missing hierarchies collection in entrypoint')

    const collection = await api.fetchResource(collectionURI.id.value)

    context.commit('storeCollection', collection)
  },
}

const mutations: MutationTree<HierarchiesState> = {
  storeCollection (state, collection) {
    state.collection = collection || null
  },
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
}
