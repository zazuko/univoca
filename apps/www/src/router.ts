import { createRouter, createWebHistory, LocationQuery, RouteLocation, RouteRecordRaw } from 'vue-router'
import { vuexOidcCreateRouterMiddleware } from 'vuex-oidc'

import OidcCallback from '@/components/auth/OidcCallback.vue'
import OidcError from '@/components/auth/OidcError.vue'
import store from '@/store'
import Authenticated from '@/views/Authenticated.vue'
import PageNotFound from '@/views/PageNotFound.vue'
import Logout from '@/views/Logout.vue'
import NotAuthorized from '@/views/NotAuthorized.vue'
import SharedDimensions from '@/views/SharedDimensions.vue'
import SharedDimension from '@/views/SharedDimension.vue'
import SharedDimensionCreate from '@/views/SharedDimensionCreate.vue'
import SharedDimensionTermCreate from '@/views/SharedDimensionTermCreate.vue'
import SharedDimensionTermEdit from '@/views/SharedDimensionTermEdit.vue'
import SharedDimensionEdit from '@/views/SharedDimensionEdit.vue'
import Hierarchies from '@/views/Hierarchies.vue'
import HierarchyCreate from '@/views/HierarchyCreate.vue'
import Hierarchy from '@/views/Hierarchy.vue'
import HierarchyEdit from '@/views/HierarchyEdit.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Authenticated,
    redirect: { name: 'SharedDimensions' },
    children: [
      {
        path: '/shared-dimensions',
        name: 'SharedDimensions',
        component: SharedDimensions,
        children: [
          {
            path: 'new',
            name: 'SharedDimensionCreate',
            component: SharedDimensionCreate,
          },
        ],
      },
      {
        path: '/shared-dimensions/:id',
        name: 'SharedDimension',
        component: SharedDimension,
        children: [
          {
            path: 'edit',
            name: 'SharedDimensionEdit',
            component: SharedDimensionEdit,
          },
          {
            path: 'terms/new',
            name: 'SharedDimensionTermCreate',
            component: SharedDimensionTermCreate,
          },
          {
            path: 'terms/:termId/edit',
            name: 'SharedDimensionTermEdit',
            component: SharedDimensionTermEdit,
          }
        ],
      },
      {
        path: '/hierarchies',
        name: 'Hierarchies',
        component: Hierarchies,
        children: [
          {
            path: 'new',
            name: 'HierarchyCreate',
            component: HierarchyCreate,
          },
        ],
      },
      {
        path: '/hierarchies/:id',
        name: 'Hierarchy',
        component: Hierarchy,
        children: [{
          path: 'edit',
          name: 'HierarchyEdit',
          component: HierarchyEdit
        }]
      }
    ],
  },
  {
    path: '/oidc-callback',
    name: 'OidcCallback',
    component: OidcCallback,
  },
  {
    path: '/oidc-error',
    name: 'OidcError',
    component: OidcError,
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout,
  },
  {
    path: '/unauthorized',
    name: 'NotAuthorized',
    component: NotAuthorized,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'PageNotFound',
    component: PageNotFound,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

if (!process.env.VUE_APP_E2E) {
  router.beforeEach(vuexOidcCreateRouterMiddleware(store, 'auth'))
}

export default router

/**
 * Replicates the route "active" matching behavior of vue-router 3.x.
 *
 * Copied from https://github.com/vuejs/rfcs/blob/master/active-rfcs/0028-router-active-link.md#motivation
 */
export function isRouteActive (route: RouteLocation, currentRoute: RouteLocation) {
  return currentRoute.path.startsWith(route.path) && includesQuery(currentRoute.query, route.query)
}

function includesQuery (outter: LocationQuery, inner: LocationQuery): boolean {
  for (const key in inner) {
    const innerValue = inner[key]
    const outterValue = outter[key]
    if (typeof innerValue === 'string') {
      if (innerValue !== outterValue) return false
    } else {
      if (
        !Array.isArray(outterValue) ||
        outterValue.length !== innerValue?.length ||
        innerValue.some((value, i) => value !== outterValue[i])
      ) {
        return false
      }
    }
  }

  return true
}
