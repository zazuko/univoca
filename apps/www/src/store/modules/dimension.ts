/* eslint-disable camelcase */
import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { Dimension, DimensionTerm, RootState } from '../types'
import Remote, { RemoteData } from '@/remote'
import { PartialCollectionView } from '@rdfine/hydra'
import { hyper_query } from '@hydrofoil/vocabularies/builders/strict'
import { hydra } from '@tpluscode/rdf-ns-builders/strict'
import clownface from 'clownface'
import $rdf from 'rdf-ext'

export interface DimensionState {
  dimension: null | Dimension
  terms: RemoteData<DimensionTerm[]>
  page: number
  pageSize: number
  pager?: PartialCollectionView
}

const getInitialState = () => ({
  dimension: null,
  terms: Remote.notLoaded(),
  page: 1,
  pageSize: 10,
})

const getters: GetterTree<DimensionState, RootState> = {}

const actions: ActionTree<DimensionState, RootState> = {
  async fetch (context, id) {
    context.commit('storeDimension', null)
    context.commit('storeTerms', Remote.notLoaded())

    const dimension = await api.fetchResource<Dimension>(id)

    if (!dimension) throw new Error(`Dimension not found ${id}`)

    context.commit('storeDimension', dimension)
    context.commit('storeTerms', Remote.loaded([...dimension.member]))

    return dimension
  },

  nextPage (context) {
    const { pager } = context.state
    if (pager?.next) {
      context.dispatch('fetch', pager.next.id)
    }
  },

  prevPage (context) {
    const { pager } = context.state
    if (pager?.previous) {
      context.dispatch('fetch', pager.previous.id)
    }
  },

  changePageSize (context, pageSize) {
    const params = clownface({ dataset: $rdf.dataset() })
      .blankNode()
      .addOut(hydra.limit, pageSize)

    const pageId = context.state.dimension?.search?.expand(params)
    if (pageId) {
      context.dispatch('fetch', pageId)
    }
  },

  addTerm (context, term) {
    context.commit('storeNewTerm', term)
  },

  updateTerm (context, term) {
    context.commit('storeExistingTerm', term)
  },

  removeTerm (context, term) {
    context.commit('removeTerm', term)
  },

  reset (context) {
    context.commit('reset')
  },
}

const mutations: MutationTree<DimensionState> = {
  storeDimension (state, dimension) {
    state.dimension = dimension
    state.pager = dimension?.view.shift()

    const templateMappings = dimension?.get(hyper_query.templateMappings)

    state.page = templateMappings?.getNumber(hydra.pageIndex) || 1
    state.pageSize = templateMappings?.getNumber(hydra.limit) || state.dimension?.member?.length
  },

  storeTermsLoading (state) {
    state.terms = Remote.loading()
  },

  storeTerms (state, terms) {
    state.terms = terms
  },

  storeNewTerm (state, term) {
    if (!state.terms.data) throw new Error('Terms not loaded')

    state.terms.data.push(term)
  },

  storeExistingTerm (state, term) {
    if (!state.terms.data) throw new Error('Terms not loaded')

    const serializedTerm = term
    const index = state.terms.data.findIndex(({ clientPath }) => serializedTerm.clientPath === clientPath)

    if (index >= 0) {
      state.terms.data[index] = serializedTerm
    }
  },

  removeTerm (state, term) {
    state.terms.data = state.terms?.data?.filter(({ clientPath }) => term.clientPath !== clientPath) ?? null
  },

  reset (state) {
    Object.assign(state, getInitialState())
  },
}

export default {
  namespaced: true,
  state: getInitialState(),
  getters,
  actions,
  mutations,
}
