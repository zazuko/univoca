import type { MultiEditor, SingleEditor } from '@hydrofoil/shaperone-core'
import * as ns from '@univoca/core/ns.js'
import { prov, xsd } from '@tpluscode/rdf-ns-builders'

export const radioButtons: SingleEditor = {
  term: ns.univoca.RadioButtons,
  match (shape) {
    const { in: choices } = shape
    if (choices.length === 0) {
      return 0
    }
    const valuesLength = choices.flatMap(term => [...term.value]).length
    if (choices.length > 5 || valuesLength > 30) {
      return null
    }

    return 50
  }
}

export const checkBox: SingleEditor = {
  term: ns.univoca.Checkbox,
  match (shape) {
    const { datatype } = shape

    if (xsd.boolean.equals(datatype?.id)) {
      return 10
    }

    return 0
  }
}

// todo: should return null or be removed altogether after https://github.com/hypermedia-app/shaperone/issues/156
export const fileUpload: MultiEditor = {
  term: ns.univoca.FileUpload,
  match () {
    return 0
  }
}

// todo: should return null or be removed altogether after https://github.com/hypermedia-app/shaperone/issues/156
export const tagsWithLanguage: MultiEditor = {
  term: ns.univoca.TagsWithLanguageEditor,
  match (shape) {
    if (shape.editor?.equals(ns.univoca.TagsWithLanguageEditor)) {
      return 100
    }

    return 0
  }
}

// todo: should return null or be removed altogether after https://github.com/hypermedia-app/shaperone/issues/156
export const checkboxList: MultiEditor = {
  term: ns.univoca.CheckboxListEditor,
  match (shape) {
    if (shape.editor?.equals(ns.univoca.CheckboxListEditor)) {
      return 100
    }

    return 0
  }
}
