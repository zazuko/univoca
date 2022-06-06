import { dataset, literal, quad } from '@rdf-esm/dataset'
import { dash, rdf, rdfs } from '@tpluscode/rdf-ns-builders'
import { univoca } from '@univoca/core/ns.js'

export const Metadata = dataset([
  quad(univoca.RadioButtons, rdfs.label, literal('Radio buttons')),
  quad(univoca.FileUpload, rdf.type, dash.MultiEditor),
  quad(univoca.TagsWithLanguageEditor, rdf.type, dash.MultiEditor),
  quad(univoca.CheckboxListEditor, rdf.type, dash.MultiEditor),
])
