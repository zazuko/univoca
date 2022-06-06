// Keep this in sync with .env.local, ui/public/config.js.template and ui/public/index.html

type AppConfig = {
  oidc: {
    authority: string
    clientId: string
    scope: string
  }
  apiBase: string
  sentry?: {
    dsn: string
    environment: string
  }
}

interface Window {
  APP_CONFIG: AppConfig
}

declare module 'html-parsed-element' {
  export default class HTMLParsedElement extends HTMLElement {}
}

declare module '@univoca/core/ns.js' {
  import { NamespaceBuilder } from '@rdfjs/namespace'
  export const univoca: NamespaceBuilder
  export const meta: NamespaceBuilder
}

declare module '@univoca/core/languages.js' {
  import { Literal } from 'rdf-js'
  export const supportedLanguages: Literal[]
}
