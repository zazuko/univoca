import { sparql } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'

export default function regexSearch({ subject, object }) {
  return sparql`
    ${subject} ${schema.name} ?title .
    FILTER (REGEX(?title, "^${object.value}", "i"))
  `
}
