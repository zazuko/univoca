import { Hydra } from 'alcaeus/web'
import { Collection, HydraResponse, RdfResource, RuntimeOperation } from 'alcaeus'
import { ResponseWrapper } from 'alcaeus/ResponseWrapper'
import RdfResourceImpl, { RdfResourceCore, ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import { hydra, sh } from '@tpluscode/rdf-ns-builders'
import { ShapeBundle } from '@rdfine/shacl/bundles'
import { NodeShape, Shape, ValidationReportMixin, ValidationResultMixin } from '@rdfine/shacl'
import { ThingMixin } from '@rdfine/schema'
import { Store } from 'vuex'
import store from '@/store'
import { RootState } from '@/store/types'
import { APIError } from './errors'
import { apiResourceMixin } from './mixins/ApiResource'
import HierarchyMixin from './mixins/Hierarchy'
import DimensionMixin from './mixins/Dimension'
import DimensionTermMixin from './mixins/DimensionTerm'
import OperationMixin from './mixins/Operation'
import { findNodes } from 'clownface-shacl-path'
import { FileLiteral } from '@/forms/FileLiteral'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode, Term } from 'rdf-js'
import $rdf from 'rdf-ext'

const rootURL = window.APP_CONFIG.apiBase
const segmentSeparator = '!!' // used to replace slash in URI to prevent escaping

if (!rootURL) {
  throw new Error('Missing API_BASE setting')
}

// Tells Hydra to use the API root URI as base URI for relative URIs
Hydra.baseUri = rootURL

Hydra.resources.factory.addMixin(apiResourceMixin(rootURL, segmentSeparator))
Hydra.resources.factory.addMixin(HierarchyMixin)
Hydra.resources.factory.addMixin(OperationMixin)
Hydra.resources.factory.addMixin(DimensionMixin)
Hydra.resources.factory.addMixin(DimensionTermMixin)
Hydra.resources.factory.addMixin(...ShapeBundle)
Hydra.resources.factory.addMixin(ThingMixin)
Hydra.resources.factory.addMixin(ValidationReportMixin)
Hydra.resources.factory.addMixin(ValidationResultMixin)

// Inject the access token in all requests if present
Hydra.defaultHeaders = ({ uri }) => prepareHeaders(uri, store)

// Cache API documentation because we know that it doesn't ever change.
Hydra.cacheStrategy.shouldLoad = (previous) => {
  return !previous.representation.root?.types.has(hydra.ApiDocumentation)
}

const pendingRequests = new Map<string, Promise<HydraResponse<any, any>>>()

export interface FetchShapeParams {
  shapesCollection?: Collection<NodeShape>
  targetClass?: Term
}

export const api = {
  async fetchResource <T extends RdfResourceCore = RdfResource> (id: string | NamedNode): Promise<T> {
    const url = typeof id === 'string' ? id : id.value

    let request = pendingRequests.get(url)
    if (!request) {
      request = Hydra.loadResource<T>(url.split(segmentSeparator).join('/'))
      pendingRequests.set(url, request)
    }

    const response = await request
    pendingRequests.delete(url)

    if (response.response?.xhr.status !== 200) {
      throw await APIError.fromResponse(response)
    }

    const resource = response.representation?.root
    if (!resource) {
      throw new Error('Response does not contain resource')
    }

    return resource
  },

  async fetchOperationShape (operation: RuntimeOperation, { targetClass, shapesCollection }: FetchShapeParams = {}): Promise<Shape | null> {
    const expects: RdfResource | undefined = operation.expects.find(expects => 'load' in expects)

    const headers: HeadersInit = {}
    if (targetClass && shapesCollection) {
      const params = clownface({ dataset: $rdf.dataset() })
        .blankNode()
        .addOut(sh.targetClass, targetClass)
      const searchUrl = shapesCollection.search?.expand(params)

      if (searchUrl) {
        const shapes = await api.fetchResource<Collection>(searchUrl)
        const shapeId = shapes?.member?.shift()?.id.value
        if (shapeId) {
          const shape = await api.fetchResource(shapeId)
          if (isShape(shape)) {
            return shape
          }
        }
      }
    }

    if (expects && expects.load) {
      const { representation } = await expects.load<Shape>(headers)
      if (isShape(representation?.root)) {
        return representation!.root
      }
    }

    console.warn('No hydra:expects found for operation or did not dereference a sh:NodeShape')
    return null
  },

  prepareOperationBody (data: RdfResource, operation: RuntimeOperation): { body: File | FormData | string; contentHeaders: HeadersInit } {
    const embeddedFiles = operation.multiPartPaths
      .reduce((previous, { pointer: path }) => {
        return [
          ...previous,
          ...findNodes(data.pointer, path).toArray()
        ]
      }, [] as GraphPointer[])

    const body = JSON.stringify(data.toJSON())

    if (embeddedFiles.length) {
      const formData = new FormData()
      formData.append('representation', new Blob([body], {
        type: 'application/ld+json'
      }))

      for (const file of embeddedFiles) {
        const term = file.term instanceof FileLiteral ? file.term : null
        if (term) {
          formData.append(term.value, term.file)
        }
      }

      return {
        body: formData,
        // not setting 'multipart/form-data' because the browser will do that
        // only this way the multipart boundary is set automatically
        contentHeaders: {},
      }
    }

    return {
      body,
      contentHeaders: { 'content-type': 'application/ld+json' }
    }
  },

  async invokeSaveOperation<T extends RdfResource = RdfResource> (operation: RuntimeOperation | null | undefined, resource: RdfResource | GraphPointer<ResourceIdentifier>, headers: HeadersInit = {}): Promise<T | null | undefined> {
    const data = 'toJSON' in resource
      ? resource
      : RdfResourceImpl.factory.createEntity(resource) as RdfResource

    if (!operation) throw new Error('Operation does not exist')

    const { body, contentHeaders } = this.prepareOperationBody(data, operation)
    const response = await operation.invoke<T>(body, {
      ...contentHeaders,
      ...headers,
    })

    if (!response.response?.xhr.ok) {
      throw await APIError.fromResponse(response)
    }

    const responseResource = response.representation?.root
    if (response.response.xhr.status === 201 && !responseResource) {
      throw new Error('Response does not contain created resource')
    }

    return responseResource
  },

  async invokeDeleteOperation (operation: RuntimeOperation | null): Promise<void> {
    if (!operation) throw new Error('Operation does not exist')

    const response = await operation.invoke('')

    if (response.response?.xhr.status !== 204) {
      throw await APIError.fromResponse(response)
    }
  },

  async invokeDownloadOperation (operation: RuntimeOperation | null, headers: Record<string, string> = {}): Promise<ResponseWrapper> {
    if (!operation) throw new Error('Operation does not exist')

    const response = await operation.invoke('', headers)

    if (response.response?.xhr.status !== 305) {
      throw await APIError.fromResponse(response)
    }

    return response.response
  },
}

export function prepareHeaders (uri: string, store: Store<RootState>): Record<string, string> {
  const headers: Record<string, string> = {}

  if (!uri.startsWith(rootURL)) {
    return headers
  }

  const token = store.state.auth.access_token
  if (token) {
    headers.authorization = `Bearer ${token}`
  }

  if (process.env.VUE_APP_X_USER) {
    headers['x-user'] = process.env.VUE_APP_X_USER
  }

  if (process.env.VUE_APP_X_PERMISSION) {
    headers['x-permission'] = process.env.VUE_APP_X_PERMISSION
  }

  return headers
}

function isShape (arg: RdfResource | undefined | null): arg is NodeShape {
  return arg?.types.has(sh.NodeShape) || false
}
