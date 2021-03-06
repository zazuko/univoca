import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { sh } from '@tpluscode/rdf-ns-builders'
import { fromPointer as nodeShape } from '@rdfine/shacl/lib/NodeShape'
import { fromPointer as propertyShape } from '@rdfine/shacl/lib/PropertyShape'
import { univoca } from '@univoca/core/ns.js'
import { FALSE, TRUE } from './rdf.js'

export async function generate({ req, event }) {
  const dimension = await req.knossos.store.load(event.object.id)

  const termShape = clownface({ dataset: $rdf.dataset() })
    .namedNode(`${dimension.value}/_term-shape`)

  const group = req.rdf.namedNode('/shape-group/term-properties')
  const properties = dimension.out(univoca.termShape).out(sh.property)
    .map((property, index) => {
      let minCount
      let maxCount
      if (TRUE.equals(property.out(univoca.required).term)) {
        minCount = 1
      }
      if (FALSE.equals(property.out(univoca.multipleValues).term)) {
        maxCount = 1
      }

      return propertyShape({
        name: property.out(sh.name).term,
        path: property.out(sh.path).term,
        datatype: property.out(sh.datatype).term,
        class: property.out(sh.class).term,
        languageIn: property.out(univoca.languageIn).map(toIsoCode),
        minCount,
        maxCount,
        order: 100 + index,
        group,
      })
    })

  nodeShape(termShape, {
    targetClass: dimension.out(univoca.termShape).out(sh.targetClass),
    and: [req.rdf.namedNode('/api/univoca/DimensionTerm')],
    property: propertyShape({
      path: univoca.term,
      name: 'Term properties',
      minCount: 1,
      maxCount: 1,
      nodeKind: sh.BlankNode,
      order: 10,
      node: nodeShape({
        and: [
          req.rdf.namedNode('/api/meta/SharedDimensionTerm'),
        ],
        property: properties,
      }),
    }),
  })

  await req.knossos.store.save(termShape)
}

function toIsoCode({ value: langUri }) {
  return langUri.substring(langUri.lastIndexOf('/') + 1)
}
