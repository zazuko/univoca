import { toRdf } from 'rdf-literal'
import $rdf from 'rdf-ext'

export const TRUE = toRdf(true)
export const FALSE = toRdf(false)

export function rename(pointer, from, to) {
  for (const quad of pointer.dataset) {
    if (quad.subject.equals(from)) {
      pointer.dataset.delete(quad)
      pointer.dataset.add($rdf.quad(to, quad.predicate, quad.object, quad.graph))
    }
    if (quad.object.equals(from)) {
      pointer.dataset.delete(quad)
      pointer.dataset.add($rdf.quad(quad.subject, quad.predicate, to, quad.graph))
    }
  }
}
