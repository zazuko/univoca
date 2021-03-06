import { html, SingleEditorComponent, Lazy, MultiEditorComponent } from '@hydrofoil/shaperone-wc'
import {
  EnumSelectEditor, enumSelect as enumSelectCore,
  InstancesSelectEditor, instancesSelect as instancesSelectCore, Item
} from '@hydrofoil/shaperone-core/components'
import * as ns from '@univoca/core/ns.js'
import { dash, hydra, rdfs, xsd } from '@tpluscode/rdf-ns-builders/strict'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import { FocusNode } from '@hydrofoil/shaperone-core'
import { createCustomElement } from '../custom-element'
import '@rdfine/dash/extensions/sh/PropertyShape'
import * as hierarchyIntrospectionQueries from '@zazuko/cube-hierarchy-query/introspect.js'
import * as hierarchyResourceQueries from '@zazuko/cube-hierarchy-query/resources.js'
import { loader } from './hierarchy/index'
import { SingleEditorRenderParams } from '@hydrofoil/shaperone-core/models/components/index'
import { InstancesSelect } from '@hydrofoil/shaperone-core/lib/components/instancesSelect'
import StreamClient from 'sparql-http-client'

export const textField: Lazy<SingleEditorComponent> = {
  editor: dash.TextFieldEditor,
  async lazyRender () {
    await import('./TextFieldEditor.vue').then(createCustomElement('textfield-editor'))

    return ({ property, value }, { update }) => html`<textfield-editor .value="${value.object?.value || ''}"
                                                                       .update="${update}"
                                                                       ?readonly="${property.shape.readOnly}"></textfield-editor>`
  }
}

export const textFieldWithLang: Lazy<SingleEditorComponent> = {
  editor: dash.TextFieldWithLangEditor,
  async lazyRender () {
    await import('./TextFieldWithLangEditor.vue').then(createCustomElement('cc-text-field-with-lang'))

    return ({ value, property }, { update }) => html`<cc-text-field-with-lang
      .value="${value.object?.term}"
      .property="${property}"
      .update="${update}"
    ></cc-text-field-with-lang>`
  }
}

export const textAreaWithLang: Lazy<SingleEditorComponent> = {
  editor: dash.TextAreaWithLangEditor,
  async lazyRender () {
    await import('./TextFieldWithLangEditor.vue').then(createCustomElement('cc-text-field-with-lang'))

    return ({ value, property }, { update }) => html`<cc-text-field-with-lang
      .value="${value.object?.term}"
      .property="${property}"
      .update="${update}"
      input-type="textarea"
    ></cc-text-field-with-lang>`
  }
}

export const instanceSelect: Lazy<InstancesSelectEditor> = {
  ...instancesSelectCore,
  async lazyRender () {
    await import('./SelectEditor.vue').then(createCustomElement('select-editor'))

    return ({ property, value }, { update }) => html`<select-editor .property="${property.shape}"
                          .update="${update}"
                          .options="${value.componentState.instances}"
                          .value="${value.object?.term}"></select-editor>`
  }
}

export const enumSelect: Lazy<EnumSelectEditor> = {
  ...enumSelectCore,
  async lazyRender () {
    await import('./SelectEditor.vue').then(createCustomElement('select-editor'))

    return ({ property, value }, { update }) =>
      html`<select-editor .property="${property.shape}"
                          .update="${update}"
                          .options="${value.componentState.choices}"
                          .value="${value.object?.term}"></select-editor>`
  }
}

export const autoComplete: Lazy<InstancesSelectEditor> = {
  ...instancesSelectCore,
  editor: dash.AutoCompleteEditor,
  init (params, actions) {
    const hasFreeTextQueryVariable = !!this.searchTemplate?.(params)?.mapping
      .some(({ property }) => property?.equals(hydra.freetextQuery))

    if (!hasFreeTextQueryVariable) {
      return instancesSelectCore.init?.call(this, params, actions) || true
    }

    const { form, property, value, updateComponentState } = params
    const { object } = value

    function updateLoadingState ({ loading = false, ready = true } = {}) {
      updateComponentState({
        loading,
        ready,
      })
    }

    const componentNotLoaded = !value.componentState.ready && !value.componentState.loading
    const hasNoLabel = object?.term.termType === 'NamedNode' && !object?.out(form.labelProperties).terms.length

    if (componentNotLoaded && object && hasNoLabel) {
      updateLoadingState({
        loading: true,
        ready: false,
      })

      const loadInstance = async () => {
        if (object?.value.startsWith('urn:')) {
          return
        }

        const instance = await this.loadInstance({ property: property.shape, value: object })
        if (instance) {
          const objectNode = property.shape.pointer.node(object)
          for (const labelProperty of form.labelProperties) {
            objectNode.addOut(labelProperty, instance.out(labelProperty))
          }
        }
      }

      loadInstance().then(() => updateLoadingState()).catch(updateLoadingState)

      return false
    }
    if (!value.componentState.ready) {
      updateLoadingState()
    }

    return !!value.componentState.ready
  },
  async lazyRender () {
    await import('./AutoCompleteEditor.vue').then(createCustomElement('auto-complete'))

    return (params, { update }) => {
      const { property, value, form } = params
      async function load (this: typeof autoComplete, e: CustomEvent) {
        const [filter, loading] = e.detail

        if (!this.shouldLoad(params, filter)) {
          return
        }

        loading?.(true)
        const pointers = await this.loadChoices(params, filter)
        const instances = pointers.map<Item>(p => [p, this.label(p, params.form)])
        params.updateComponentState({
          instances,
        })
        loading?.(false)
      }

      const label = value.object ? this.label(property.shape.pointer.node(value.object), form) : 'Select'

      return html`<auto-complete .property="${property.shape}"
                            .update="${update}"
                            .options="${value.componentState.instances}"
                            .value="${value.object?.term}"
                            .placeholder="${label}"
                            @search="${load.bind(this)}"></auto-complete>`
    }
  }
}

export const radioButtons: Lazy<SingleEditorComponent> = {
  editor: ns.univoca.RadioButtons,
  async lazyRender () {
    await import('./RadioButtons.vue').then(createCustomElement('radio-buttons'))

    return ({ property, value }, { update }) => {
      const items = property.shape.pointer.node(property.shape.in)

      return html`<radio-buttons .options="${items}" .value="${value.object}" .update="${update}"></radio-buttons>`
    }
  }
}

export const colorPicker: Lazy<SingleEditorComponent> = {
  editor: ns.univoca.ColorPicker,
  async lazyRender () {
    await import('./ColorPicker.vue').then(createCustomElement('color-picker'))

    return ({ value }, { update }) => html`<color-picker .value="${value.object?.value || ''}" .update="${update}"></color-picker>`
  }
}

const trueTerm = $rdf.literal('true', xsd.boolean)

export const checkBox: Lazy<SingleEditorComponent> = {
  editor: ns.univoca.Checkbox,
  async lazyRender () {
    await import('./CheckboxEditor.vue').then(createCustomElement('cc-checkbox'))

    return ({ value }, { update }) => {
      const booleanValue = trueTerm.equals(value.object?.term)
      return html`<cc-checkbox .value="${booleanValue}" .update="${update}"></cc-checkbox>`
    }
  },
}

export const uriEditor: Lazy<SingleEditorComponent> = {
  editor: dash.URIEditor,
  async lazyRender () {
    await import('./URIInput.vue').then(createCustomElement('cc-uri-input'))

    return ({ value }, { update }) => html`<cc-uri-input .value="${value.object}" .update="${update}"></cc-uri-input>`
  }
}

export const datePickerEditor: Lazy<SingleEditorComponent> = {
  editor: dash.DatePickerEditor,
  async lazyRender () {
    await import('./DatePickerEditor.vue').then(createCustomElement('cc-date-picker'))

    return ({ value }, { update }) => html`<cc-date-picker .value="${value.object?.value}" .update="${update}"></cc-date-picker>`
  },
}

export const dateTimePickerEditor: Lazy<SingleEditorComponent> = {
  editor: dash.DateTimePickerEditor,
  async lazyRender () {
    await import('./DateTimePickerEditor.vue').then(createCustomElement('cc-date-time-picker'))

    return ({ value }, { update }) => html`<cc-date-time-picker .value="${value.object?.value}" .update="${update}"></cc-date-time-picker>`
  },
}

export const propertyEditor: Lazy<SingleEditorComponent> = {
  editor: ns.univoca.PropertyEditor,
  async lazyRender () {
    await import('./PropertyInput.vue').then(createCustomElement('uv-property-input'))

    return ({ value }, { update }) => html`<uv-property-input .value="${value.object?.term}" .update="${update}"></uv-property-input>`
  },
}

function isFocusNode (value?: GraphPointer): value is FocusNode {
  return value?.term.termType === 'NamedNode' || value?.term.termType === 'BlankNode'
}

export const nestedForm: SingleEditorComponent = {
  editor: dash.DetailsEditor,
  render ({ property: { shape: { node } }, value, renderer }) {
    const focusNode = value.object

    if (isFocusNode(focusNode)) {
      return html`<div class="box">${renderer.renderFocusNode({ focusNode, shape: node })}</div>`
    }

    return html``
  }
}

export const tagsWithLanguage: Lazy<MultiEditorComponent> = {
  editor: ns.univoca.TagsWithLanguageEditor,
  async lazyRender () {
    await import('./TagsWithLanguageEditor.vue').then(createCustomElement('tags-with-language-editor'))

    return ({ property }, { update }) => {
      return html`<tags-with-language-editor
        .property="${property}"
        .update="${update}"
      ></tags-with-language-editor>`
    }
  }
}

export const fileUpload: Lazy<SingleEditorComponent> = {
  editor: ns.univoca.FileUpload,
  async lazyRender () {
    await import('./FileUploadEditor.vue').then(createCustomElement('file-upload-editor'))

    return (arg, { update }) => {
      return html`<file-upload-editor .update="${update}"></file-upload-editor>`
    }
  }
}

export const checkboxList: Lazy<MultiEditorComponent> = {
  editor: ns.univoca.CheckboxListEditor,
  async lazyRender () {
    await import('./CheckboxListEditor.vue').then(createCustomElement('checkbox-list'))

    return ({ property }, { update }) => {
      const values = property.objects.map(obj => obj.object?.term).filter(Boolean)
      const choices = property.shape.in.map(term => [term, property.shape.pointer.node(term).value])
      return html`<checkbox-list .value="${values}"
                                 .choices="${choices}"
                                 .update="${update}"></checkbox-list>`
    }
  }
}

interface HierarchyPathComponentState extends InstancesSelect {
  client?: StreamClient
  queryUi?: string
  example?: GraphPointer
}

interface HierarchyPathEditor extends SingleEditorComponent<HierarchyPathComponentState> {
  loadExample(arg: SingleEditorRenderParams<HierarchyPathComponentState>): Promise<void>
  _init(arg: SingleEditorRenderParams): void
}

export const hierarchyPath: Lazy<HierarchyPathEditor> = {
  ...loader(hierarchyIntrospectionQueries.properties, instanceSelect),
  editor: ns.univoca.HierarchyPathEditor,
  _init (context) {
    if (context.value.object && !context.value.componentState.example) {
      this.loadExample(context)
    }
  },
  async loadExample ({ value, focusNode, updateComponentState }) {
    const client = value.componentState.client
    const queryUi = value.componentState.queryUi
    const query = hierarchyResourceQueries.example(focusNode)
    if (!client || !query) return

    let moreExamples: URL | undefined
    if (queryUi) {
      moreExamples = new URL(queryUi)
      const params = new URLSearchParams({
        query: hierarchyResourceQueries.example(focusNode)?.build() || ''
      })
      moreExamples.hash = params.toString()
    }

    const stream = await query.execute(client.query)
    const dataset = await $rdf.dataset().import(stream)
    updateComponentState({
      example: clownface({ dataset }).in().toArray().shift(),
      moreExamples: moreExamples?.toString()
    })
  },
  async lazyRender () {
    await import('./HierarchyPathEditor.vue').then(createCustomElement('hierarchy-path'))

    return ({ value, updateComponentState }, { update }) => {
      const onUpdate: typeof update = (arg) => {
        update(arg)
        updateComponentState({
          example: undefined
        })
      }

      return html`<hierarchy-path .update="${onUpdate}"
                                  .value="${value.object}"
                                  .properties="${value.componentState.instances}"
                                  .example="${value.componentState.example}"
                                  .moreExamples="${value.componentState.moreExamples}"></hierarchy-path>`
    }
  }
}

export const hierarchyLevelTarget: Lazy<InstancesSelectEditor> = {
  ...loader(hierarchyIntrospectionQueries.types, instanceSelect),
  editor: ns.univoca.HierarchyLevelTargetEditor,
}
