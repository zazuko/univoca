import { sparql } from '@tpluscode/sparql-builder'

export function filterByTargetClass({ subject, predicate, object }) {
  return sparql`${subject} ${predicate} ${object.term}`
}
