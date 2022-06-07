import { ActionTree, MutationTree, GetterTree } from 'vuex'
import { api } from '@/api'
import { Dimension, DimensionTerm, RootState } from '../types'
import { Collection } from 'alcaeus'
import Remote, { RemoteData } from '@/remote'

export interface DimensionState {
  dimension: null | Dimension
  terms: RemoteData<DimensionTerm[]>
  page: number
  pageSize: number
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

    const dimension = api.fetchResource<Dimension>(id)

    if (!dimension) throw new Error(`Dimension not found ${id}`)

    context.commit('storeDimension', dimension)

    // if (dimension.terms) {
    //      context.dispatch('fetchDimensionTerms')
    //    }

    return dimension
  },

  async fetchDimensionTerms (context) {
    const { dimension, page, pageSize } = context.state

    if (!dimension || !dimension.terms) throw new Error('Dimension not loaded')

    context.commit('storeTerms', Remote.loading())

    const uri = new URL(dimension.terms.value)
    uri.searchParams.append('page', page.toString())
    uri.searchParams.append('pageSize', pageSize.toString())

    try {
      const termsCollection = await api.fetchResource<Collection>(uri.toString())
      const terms = termsCollection.member
      context.commit('storeTerms', Remote.loaded(terms))
      return terms
    } catch (e: any) {
      context.commit('storeTerms', Remote.error(e.toString()))
    }
  },

  nextPage (context) {
    context.commit('storePage', context.state.page + 1)
    context.dispatch('fetchDimensionTerms')
  },

  prevPage (context) {
    context.commit('storePage', context.state.page - 1)
    context.dispatch('fetchDimensionTerms')
  },

  changePageSize (context, pageSize) {
    context.commit('storePage', 1)
    context.commit('storePageSize', pageSize)
    context.dispatch('fetchDimensionTerms')
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

  storePage (state, page) {
    state.page = page
  },

  storePageSize (state, pageSize) {
    state.pageSize = pageSize
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
