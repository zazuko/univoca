import { createStore } from 'vuex'
import { auth } from './modules/auth'
import app from './modules/app'
import api from './modules/api'
import hierarchy from './modules/hierarchy'
import hierarchies from './modules/hierarchies'
import sharedDimensions from './modules/sharedDimensions'
import sharedDimension from './modules/sharedDimension'
import { RootState } from './types'

export default createStore<RootState>({
  modules: {
    app,
    auth: auth(),
    api,
    hierarchy,
    hierarchies,
    sharedDimensions,
    sharedDimension,
  },
})
