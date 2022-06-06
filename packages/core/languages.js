import rdf from '@rdfjs/data-model'

export const supportedLanguages = ['de', 'fr', 'it', 'rm', 'en'].map(v => rdf.literal(v))
