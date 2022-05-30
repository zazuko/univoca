import { sparql } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { toRdf } from 'rdf-literal'

const TRUE = toRdf(true)

export function onlyValidTerms({ subject, object }) {
  if (object.term.equals(TRUE)) {
    const validThrough = toRdf(new Date())

    return sparql`
      OPTIONAL {
        ${subject} ${schema.validThrough} ?validThrough .
      }
      
      FILTER (
        !bound(?validThrough) || ?validThrough >= ${validThrough}
      )
    `
  }

  return ''
}

export function dimensionFilter({ subject, predicate, object }) {
  return sparql`${subject} ${predicate} ${object.term}`
}
