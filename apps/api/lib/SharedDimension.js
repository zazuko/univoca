import { dcterms, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import httpError from 'http-errors'
import { univoca, meta } from '@univoca/core/ns.js'
import { isBlankNode } from 'is-graph-pointer'
import $rdf from 'rdf-ext'
import { hydra } from '@tpluscode/rdf-ns-builders/strict'
import { knossos } from '@hydrofoil/vocabularies/builders/strict'
import { fromPointer as hydraTemplate } from '@rdfine/hydra/lib/IriTemplate'
import { fromPointer as hydraTemplateMapping } from '@rdfine/hydra/lib/IriTemplateMapping'
import { fromPointer as memberAssertion } from '@rdfine/hydra/lib/MemberAssertion'
import * as CONST from './rdf.js'

export function injectTermsLink(req, pointer) {
  pointer.any().has(rdf.type, schema.DefinedTermSet).forEach((termSet) => {
    const terms = new URL(req.rdf.namedNode('/terms').value)
    terms.searchParams.set('dimension', termSet.value)
    termSet.addOut(univoca.terms, termSet.namedNode(terms.toString()))
  })
}

const createdDimensionTypes = [univoca.NewDimension, univoca.ImportedDimension]

export function prepareCreated(req, pointer) {
  // TODO https://github.com/hypermedia-app/creta/issues/388
  if (req.method === 'POST' && !pointer.has(rdf.type, createdDimensionTypes).terms.length) {
    throw new httpError.BadRequest('Missing expected RDF type')
  }

  const identifier = pointer.out(dcterms.identifier).value

  pointer
    .addOut(rdf.type, univoca.ManagedDimension)
    .addOut(hydra.search, req.rdf.namedNode('/api/Dimension#search'))
    .addOut(hydra.memberAssertion, (ma) => {
      memberAssertion(ma, {
        property: schema.isPartOf,
        object: pointer,
      })
    })
    .addOut(knossos.memberTemplate, (template) => {
      hydraTemplate(template, {
        template: `/dimension/${identifier}/{identifier}`,
        mapping: hydraTemplateMapping({
          variable: 'identifier',
          property: dcterms.identifier,
          required: true,
        }),
      })
    })

  pointer
    .out(univoca.dimension)
    .addOut(rdf.type, [meta.SharedDimension, schema.DefinedTermSet])

  let termShape = pointer.out(univoca.termShape)
  if (!termShape.term) {
    termShape = pointer.blankNode().addIn(univoca.termShape, pointer)
  }
  termShape
    .addOut(sh.targetClass, req.rdf.namedNode(`/term-type/${identifier}`))
    .addOut(sh.deactivated, true)

  const dimension = pointer.out(univoca.dimension)
  if (isBlankNode(dimension)) {
    // TODO: change hardcoded URI
    const dimensionIri = dimension.namedNode(`https://ld.admin.ch/cube/dimension/${identifier}`).term

    for (const quad of dimension.dataset) {
      if (quad.subject.equals(dimension.term)) {
        dimension.dataset.delete(quad)
        dimension.dataset.add($rdf.quad(dimensionIri, quad.predicate, quad.object, quad.graph))
      }
      if (quad.object.equals(dimension.term)) {
        dimension.dataset.delete(quad)
        dimension.dataset.add($rdf.quad(quad.subject, quad.predicate, dimensionIri, quad.graph))
      }
    }
  }
}

export function removeGeneratedProperties({ after }) {
  after.deleteOut([
    univoca.terms,
    univoca.export,
  ])
  after.deleteOut(rdf.type, createdDimensionTypes)
}

export function updateTermShapeConstraints({ after }) {
  after.out(univoca.termShape).out(sh.property)
    .forEach((property) => {
      const required = CONST.TRUE.equals(property.out(univoca.required).term)
      const maxOne = CONST.FALSE.equals(property.out(univoca.multipleValues).term)

      property.deleteOut(sh.minCount).deleteOut(sh.maxCount)

      if (required) {
        property.addOut(sh.minCount, 1)
      }
      if (maxOne) {
        property.addOut(sh.maxCount, 1)
      }
    })
}
